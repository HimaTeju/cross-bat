# -*- coding: utf-8 -*-
"""
Builds server/data/squad-builder.json for the "Build Your XI" mini-game: a
per-player dataset of role (Batter/Bowler/All-rounder/Wicketkeeper), career
runs, wickets, matches ("caps"), and IPL trophies won - so the game can
spin a random stat category and let the user draft a realistic,
role-constrained XI to maximize it.

Reuses:
- parse_matches() / MATCHES_DIR from build_full_data.py for identity
  resolution and team-season history (same as every other build script).
- aggregate_stats() / most_recent_team() from build_target_chase_data.py
  for runs/wickets/matches and each player's franchise badge - no need to
  re-walk every delivery a second time for numbers Target Chase already
  computes.
- CHAMPIONS from awards_source.py (season -> winning franchise, the same
  hand-verified list the awards feature uses) to credit a trophy to every
  player who was on that franchise's roster in that specific season - this
  is exactly the "IPL Champion" derivation earlier build scripts deferred
  for lack of match data; it's feasible now that cricsheet/matches/ is
  populated locally (see build_career_path_data.py's docstring).

Role is inferred, not hand-tagged - there's no "position" field anywhere
in Cricsheet data:
  - Wicketkeeper: credited as the fielder on enough "stumped" dismissals
    across a career. A one-off deputy keeper won't clear the threshold;
    a team's regular gloveman will.
  - Bowler / All-rounder / Batter: from career rate on both disciplines
    (wickets and runs per match played), not raw totals - otherwise a
    16-season batter could out-"bowl" a part-timer purely on total
    wickets bowled in a handful of overs across a long career.
This is a heuristic, not ground truth - expect a few edge cases (a
part-time bowler who bats at 8 might read as a pure batter). Good enough
to seed the pool; can be hand-corrected later the same way the awards
review queue lets a human fix a bad automatic match.
"""
import glob
import json
from collections import defaultdict

from build_full_data import parse_matches, MATCHES_DIR
from build_target_chase_data import aggregate_stats, most_recent_team
from awards_source import CHAMPIONS

OUTPUT_PATH = "server/data/squad-builder.json"

SQUAD_SIZE = 11
SLOTS = {
    "wicketkeeper": {"min": 1, "max": 1},
    "batter": {"min": 3, "max": 6},
    "allrounder": {"min": 1, "max": 4},
    "bowler": {"min": 3, "max": 6},
}
ROLE_POOL_SIZE = {"wicketkeeper": 12, "batter": 30, "allrounder": 16, "bowler": 30}

STUMPING_KEEPER_THRESHOLD = 5  # career stumping-assists to be classed a keeper
BOWLING_REGULAR_RATE = 0.5     # wickets per match to count as a "regular" bowler
BATTING_REGULAR_RATE = 8       # runs per match to count as a "regular" batter


def season_sort_key(s):
    try:
        return int(s[:4])
    except ValueError:
        return 0


def count_stumping_credits():
    credits = defaultdict(int)
    for fp in glob.glob(f"{MATCHES_DIR}/*.json"):
        try:
            with open(fp, encoding="utf-8") as f:
                d = json.load(f)
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        registry = d.get("info", {}).get("registry", {}).get("people", {})
        if not registry:
            continue
        for inn in d.get("innings", []):
            for over in inn.get("overs", []):
                for ball in over.get("deliveries", []):
                    for w in ball.get("wickets") or []:
                        if w.get("kind") != "stumped":
                            continue
                        for fielder in w.get("fielders") or []:
                            pid = registry.get(fielder.get("name"))
                            if pid:
                                credits[pid] += 1
    return credits


def count_trophies(id_to_team_seasons):
    # De-dupe (team, year) per player first, in case the same real season
    # shows up under two different season-string formats (e.g. "2020" and
    # "2020/21" both appearing for the UAE-hosted 2020 season).
    trophies = {}
    for pid, team_seasons in id_to_team_seasons.items():
        won = set()
        for team, seasons in team_seasons.items():
            for s in seasons:
                year = season_sort_key(s)
                if CHAMPIONS.get(year) == team:
                    won.add((team, year))
        trophies[pid] = len(won)
    return trophies


def classify_role(runs, wickets, matches, stump_credits):
    if stump_credits >= STUMPING_KEEPER_THRESHOLD:
        return "wicketkeeper"
    if matches == 0:
        return "batter"
    is_bowling_regular = (wickets / matches) >= BOWLING_REGULAR_RATE
    is_batting_regular = (runs / matches) >= BATTING_REGULAR_RATE
    if is_bowling_regular and is_batting_regular:
        return "allrounder"
    if is_bowling_regular:
        return "bowler"
    return "batter"


def best_possible(entries, stat_key):
    """Best achievable total for one stat under the slot rules, via a
    simple greedy fill: take each role's minimum first (its strongest
    candidates by this stat), then fill the remaining slots with whatever's
    left over that scores highest, still capped by each role's max."""
    by_role = defaultdict(list)
    for e in entries:
        by_role[e["role"]].append(e)
    for role in by_role:
        by_role[role].sort(key=lambda e: -e[stat_key])

    chosen = []
    for role, rule in SLOTS.items():
        chosen.extend(by_role[role][:rule["min"]])

    leftover = []
    for role, rule in SLOTS.items():
        leftover.extend(by_role[role][rule["min"]:rule["max"]])
    leftover.sort(key=lambda e: -e[stat_key])

    chosen.extend(leftover[:SQUAD_SIZE - len(chosen)])
    return sum(e[stat_key] for e in chosen)


def build():
    _id_to_teams, id_to_name, _id_to_seasons, id_to_team_seasons = parse_matches()
    runs, wickets, matches = aggregate_stats()
    stump_credits = count_stumping_credits()
    trophies = count_trophies(id_to_team_seasons)

    pids = set(runs) | set(wickets)
    stats = []
    for pid in pids:
        name = id_to_name.get(pid)
        if not name:
            continue
        m = len(matches.get(pid, ()))
        r, w = runs.get(pid, 0), wickets.get(pid, 0)
        stats.append({
            "name": name,
            "team": most_recent_team(id_to_team_seasons.get(pid, {})),
            "role": classify_role(r, w, m, stump_credits.get(pid, 0)),
            "runs": r,
            "wickets": w,
            "matches": m,
            "trophies": trophies.get(pid, 0),
        })

    pool = {}
    role_rank_key = {
        "wicketkeeper": lambda s: s["runs"],
        "batter": lambda s: s["runs"],
        "allrounder": lambda s: s["runs"] + s["wickets"] * 20,
        "bowler": lambda s: s["wickets"],
    }
    for role, size in ROLE_POOL_SIZE.items():
        candidates = sorted((s for s in stats if s["role"] == role), key=lambda s: -role_rank_key[role](s))
        for s in candidates[:size]:
            pool[s["name"]] = s
    entries = sorted(pool.values(), key=lambda s: s["name"])

    calibration = {
        "squadSize": SQUAD_SIZE,
        "slots": SLOTS,
        "bestPossible": {
            key: best_possible(entries, key) for key in ("runs", "wickets", "matches", "trophies")
        },
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump({"players": entries, "calibration": calibration}, f, indent=2, ensure_ascii=False)

    role_counts = defaultdict(int)
    for e in entries:
        role_counts[e["role"]] += 1
    print(f"pool size: {len(entries)}")
    print("by role:", dict(role_counts))
    print("best possible:", calibration["bestPossible"])


if __name__ == "__main__":
    build()
