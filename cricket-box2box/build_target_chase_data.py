# -*- coding: utf-8 -*-
"""
Builds server/data/target-chase.json for the "Target Chase" mini-game:
each player's real total IPL runs (as a batter) and wickets (as a bowler),
computed directly from ball-by-ball delivery data in cricsheet/matches/
(mirrored from the ritesh-ojha/IPL-DATASET GitHub repo - see
build_career_path_data.py's docstring for why cricsheet.org itself isn't
used directly).

Player identity is resolved the same way as the other build scripts: each
match's info.registry.people maps the delivery-level batter/bowler name
string to a stable cricsheet person id, and parse_matches() (from
build_full_data.py) already computes a canonical display name per id by
majority vote across every match. Reusing that means this script doesn't
need its own name-voting or duplicate-identity merge pass - it inherits
whatever identity resolution the other two datasets already use, so all
three games agree on what to call a given player.
"""
import glob
import json
from collections import defaultdict

from build_full_data import parse_matches, MATCHES_DIR

OUTPUT_PATH = "server/data/target-chase.json"

# Dismissal kinds credited to the bowler (excludes run out, retired hurt/out,
# obstructing the field, timed out, handled the ball).
BOWLER_CREDITED_KINDS = {"bowled", "caught", "lbw", "stumped", "caught and bowled", "hit wicket"}

TOP_BATTERS = 35
TOP_BOWLERS = 35


def aggregate_stats():
    runs = defaultdict(int)     # pid -> career runs off the bat
    wickets = defaultdict(int)  # pid -> career bowler-credited wickets
    matches = defaultdict(set)  # pid -> set of match file paths appeared in

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
                    batter_pid = registry.get(ball.get("batter"))
                    bowler_pid = registry.get(ball.get("bowler"))
                    r = ball.get("runs", {})
                    if batter_pid:
                        runs[batter_pid] += r.get("batter", 0)
                        matches[batter_pid].add(fp)
                    if bowler_pid:
                        matches[bowler_pid].add(fp)
                        for w in ball.get("wickets") or []:
                            if w.get("kind") in BOWLER_CREDITED_KINDS:
                                wickets[bowler_pid] += 1
    return runs, wickets, matches


def build():
    _id_to_teams, id_to_name, _id_to_seasons, _id_to_team_seasons = parse_matches()
    runs, wickets, matches = aggregate_stats()

    pids = set(runs) | set(wickets)
    stats = []
    for pid in pids:
        name = id_to_name.get(pid)
        if not name:
            continue
        stats.append({
            "name": name,
            "runs": runs.get(pid, 0),
            "wickets": wickets.get(pid, 0),
            "matches": len(matches.get(pid, ())),
        })

    by_runs = sorted(stats, key=lambda s: -s["runs"])[:TOP_BATTERS]
    by_wickets = sorted(stats, key=lambda s: -s["wickets"])[:TOP_BOWLERS]

    pool = {}
    for s in by_runs + by_wickets:
        pool[s["name"]] = s
    entries = sorted(pool.values(), key=lambda s: s["name"])

    # What's achievable picking SQUAD_SIZE pure specialists from this exact
    # pool - used by the frontend to pick sensible/daily target numbers
    # instead of guessing at round numbers that might be unreachable or
    # trivial. Keep in sync with SQUAD_SIZE in web/src/target-chase/data.js.
    SQUAD_SIZE = 5
    max_runs = sum(s["runs"] for s in sorted(entries, key=lambda s: -s["runs"])[:SQUAD_SIZE])
    max_wickets = sum(s["wickets"] for s in sorted(entries, key=lambda s: -s["wickets"])[:SQUAD_SIZE])

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "players": entries,
            "calibration": {"squadSize": SQUAD_SIZE, "maxRuns": max_runs, "maxWickets": max_wickets},
        }, f, indent=2, ensure_ascii=False)

    print(f"pool size: {len(entries)} (top {TOP_BATTERS} by runs + top {TOP_BOWLERS} by wickets, deduped)")
    print(f"best-possible {SQUAD_SIZE}-pick runs: {max_runs}, best-possible {SQUAD_SIZE}-pick wickets: {max_wickets}")


if __name__ == "__main__":
    build()
