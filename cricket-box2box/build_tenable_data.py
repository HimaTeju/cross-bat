# -*- coding: utf-8 -*-
"""
Builds server/data/tenable.json for "Cricket Tenable": a pyramid guessing
game (in the style of the UK gameshow Tenable) where each category is a
real IPL top-10 leaderboard and the player tries to name all 10, in rank
order, before running out of wickets.

Player identity/name resolution is the same as every other build script -
group career stats by the central registry's canonical name
(build_player_registry.load_registry()) so a player here always agrees
with IPL Grid, Career Path and Build Your XI. Runs/wickets/matches reuse
build_target_chase_data.aggregate_stats(); sixes and catches are a new
ball-by-ball scan following the same pattern as
build_squad_builder_data.count_stumping_credits(); trophies reuse
build_squad_builder_data.count_trophies_for() and awards_source.CHAMPIONS.

Orange Cap / Purple Cap season winners (awards_source.py) are hand-curated
name strings, not Cricsheet pids, so they're resolved to a canonical
player name the same way build_awards_data.py already does it (exact
match on name/alias from server/data/players.json, falling back to a
surname+initial fuzzy key) - reusing that logic directly.

Caveat baked into the data on purpose: only ~15 unique Orange Cap winners
and a similar count of Purple Cap winners exist across 19 IPL seasons, and
most of them won exactly once - so several of a 10-slot pyramid for those
two categories are an arbitrary tie-break (by earliest win season) among
one-time winners rather than a genuine ranking. Each category entry carries
a "tieCaveat" flag so the frontend can say so.
"""
import glob
import json
from collections import defaultdict

from build_full_data import parse_matches, MATCHES_DIR
from build_player_registry import load_registry
from build_target_chase_data import aggregate_stats
from build_squad_builder_data import count_trophies_for
from build_awards_data import build_indexes, match_name
from awards_source import ORANGE_CAP, PURPLE_CAP, CHAMPIONS

OUTPUT_PATH = "server/data/tenable.json"
PLAYERS_PATH = "server/data/players.json"

TOP_N = 10


def season_sort_key(s):
    if isinstance(s, int):
        return s
    try:
        return int(s[:4])
    except ValueError:
        return 0


def count_sixes_and_catches():
    sixes = defaultdict(int)
    catches = defaultdict(int)
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
                    if batter_pid and ball.get("runs", {}).get("batter") == 6:
                        sixes[batter_pid] += 1
                    for w in ball.get("wickets") or []:
                        kind = w.get("kind")
                        if kind == "caught and bowled":
                            bowler_pid = registry.get(ball.get("bowler"))
                            if bowler_pid:
                                catches[bowler_pid] += 1
                        elif kind == "caught":
                            for fielder in w.get("fielders") or []:
                                pid = registry.get(fielder.get("name"))
                                if pid:
                                    catches[pid] += 1
    return sixes, catches


def build_surname_index(players_raw):
    """Last-token-only fallback index, for award names that spell out a
    full first name (e.g. "Lasith Malinga") where the game's canonical
    display name uses initials ("SL Malinga") - fuzzy_key's surname+first-
    initial key doesn't bridge that gap, but a bare surname usually does,
    as long as it's unambiguous."""
    by_surname = defaultdict(set)
    for p in players_raw["players"]:
        canonical = p["n"]
        for known_as in [canonical, *p.get("a", [])]:
            surname = known_as.strip().split()[-1].lower()
            by_surname[surname].add(canonical)
    return by_surname


def build_award_counts(table, exact, by_key, by_surname):
    """Season award table -> ({canonical_name: count}, {canonical_name: earliest_season_year})."""
    counts = defaultdict(int)
    first_season = {}
    for season in sorted(table, key=season_sort_key):
        raw_name = table[season][0]
        _match_type, matched_name, _candidates = match_name(raw_name, exact, by_key)
        if not matched_name:
            parts = raw_name.strip().split()
            surname_candidates = by_surname.get(parts[-1].lower(), set())
            if len(surname_candidates) > 1:
                # Narrow by first-name initial (e.g. "Lasith" -> "L") turning
                # up somewhere in the candidate's leading short-form token
                # ("SL Malinga"), since an abbreviated display name may use
                # a middle/second given name's initial rather than the first.
                first_letter = parts[0][0].lower()
                narrowed = {
                    c for c in surname_candidates
                    if first_letter in c.split()[0].lower()
                }
                if len(narrowed) == 1:
                    surname_candidates = narrowed
            if len(surname_candidates) == 1:
                matched_name = next(iter(surname_candidates))
        name = matched_name or raw_name
        counts[name] += 1
        first_season.setdefault(name, season_sort_key(season))
    return counts, first_season


def make_leaderboard(values, tiebreak_years=None):
    """{name: value} (+ optional {name: earliest-achievement-year} for
    deterministic tie-breaking, earliest first) -> top N names, ranked."""
    tiebreak_years = tiebreak_years or {}
    names = [n for n, v in values.items() if v > 0]
    names.sort(key=lambda n: (-values[n], tiebreak_years.get(n, 9999), n))
    return names[:TOP_N]


def build():
    _id_to_teams, _id_to_name, _id_to_seasons, id_to_team_seasons, _votes = parse_matches()
    runs, wickets, matches = aggregate_stats()
    sixes, catches = count_sixes_and_catches()
    registry = load_registry()

    players_raw = json.load(open(PLAYERS_PATH, encoding="utf-8"))
    exact, by_key = build_indexes(players_raw)
    by_surname = build_surname_index(players_raw)
    id_by_name = {p["n"]: p.get("id") for p in players_raw["players"]}
    aliases_by_name = {p["n"]: p.get("a", []) for p in players_raw["players"]}

    # Group every Cricsheet-derived per-pid stat by registry-resolved
    # canonical name, the same way build_squad_builder_data.py does, so a
    # split-identity player's numbers are summed rather than dropped.
    pids = set(runs) | set(wickets) | set(sixes) | set(catches) | set(id_to_team_seasons)
    by_name = {}
    for pid in pids:
        entry = registry.get(pid)
        name = entry["name"] if entry else _id_to_name.get(pid)
        if not name:
            continue
        d = by_name.setdefault(name, {
            "id": None, "aliases": set(),
            "runs": 0, "wickets": 0, "matches": set(), "sixes": 0, "catches": 0,
            "team_seasons": {},
        })
        if entry:
            if d["id"] is None:
                d["id"] = entry["id"]
            d["aliases"] |= set(entry["aliases"])
        d["runs"] += runs.get(pid, 0)
        d["wickets"] += wickets.get(pid, 0)
        d["matches"] |= matches.get(pid, set())
        d["sixes"] += sixes.get(pid, 0)
        d["catches"] += catches.get(pid, 0)
        for team, seasons in id_to_team_seasons.get(pid, {}).items():
            d["team_seasons"].setdefault(team, set()).update(seasons)

    runs_by_name, wickets_by_name, matches_by_name = {}, {}, {}
    sixes_by_name, catches_by_name = {}, {}
    trophies_by_name, trophy_first_year = {}, {}
    for name, d in by_name.items():
        runs_by_name[name] = d["runs"]
        wickets_by_name[name] = d["wickets"]
        matches_by_name[name] = len(d["matches"])
        sixes_by_name[name] = d["sixes"]
        catches_by_name[name] = d["catches"]

        won = set()
        for team, seasons in d["team_seasons"].items():
            for s in seasons:
                year = season_sort_key(s)
                if CHAMPIONS.get(year) == team:
                    won.add((team, year))
        trophies_by_name[name] = len(won)
        if won:
            trophy_first_year[name] = min(year for _, year in won)

    orange_by_name, orange_first_year = build_award_counts(ORANGE_CAP, exact, by_key, by_surname)
    purple_by_name, purple_first_year = build_award_counts(PURPLE_CAP, exact, by_key, by_surname)

    def lookup_id_aliases(name):
        if name in by_name:
            return by_name[name]["id"], sorted(by_name[name]["aliases"])
        return id_by_name.get(name), aliases_by_name.get(name, [])

    def category(cat_id, label, description, unit, values, tiebreak_years=None, tie_caveat=False):
        ranked = make_leaderboard(values, tiebreak_years)
        answers = []
        for i, name in enumerate(ranked):
            pid, aliases = lookup_id_aliases(name)
            answers.append({
                "rank": i + 1,
                "name": name,
                "id": pid,
                "a": aliases,
                "value": values[name],
            })
        return {
            "id": cat_id,
            "label": label,
            "description": description,
            "unit": unit,
            "tieCaveat": tie_caveat,
            "answers": answers,
        }

    categories = [
        category("most_runs", "Most Runs", "Career IPL runs, 2008–2026", "runs", runs_by_name),
        category("most_wickets", "Most Wickets", "Career IPL wickets, 2008–2026", "wickets", wickets_by_name),
        category("most_matches", "Most Matches Played", "Career IPL appearances, 2008–2026", "matches", matches_by_name),
        category("most_sixes", "Most Sixes", "Career IPL sixes, 2008–2026", "sixes", sixes_by_name),
        category("most_catches", "Most Catches", "Career IPL catches (fielding + caught-and-bowled), 2008–2026", "catches", catches_by_name),
        category("most_trophies", "Most IPL Trophies", "IPL titles won as part of the winning squad, 2008–2026", "titles", trophies_by_name, trophy_first_year),
        category("most_orange_caps", "Most Orange Caps Won", "Seasons finishing as the IPL's leading run-scorer", "caps", orange_by_name, orange_first_year, tie_caveat=True),
        category("most_purple_caps", "Most Purple Caps Won", "Seasons finishing as the IPL's leading wicket-taker", "caps", purple_by_name, purple_first_year, tie_caveat=True),
    ]

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump({"categories": categories}, f, indent=2, ensure_ascii=False)

    print(f"wrote {len(categories)} categories to {OUTPUT_PATH}")
    for c in categories:
        print(f"  {c['label']}: {len(c['answers'])} answers"
              + (" (tie caveat)" if c["tieCaveat"] else ""))


if __name__ == "__main__":
    build()
