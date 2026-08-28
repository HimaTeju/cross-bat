# -*- coding: utf-8 -*-
"""
Builds server/data/career-path.json for the "Career Path" mini-game: for
the most-played players, their real chronological IPL team history split
into genuine stints (a player who left a team and came back later gets two
separate blocks for it, not one span that papers over the gap) - so the
game can reveal one stint at a time, oldest first.

Reuses the same match-parsing pipeline as build_full_data.py
(parse_matches(), MATCHES_DIR) over the real Cricsheet-format match data in
cricsheet/matches/ - mirrored from the ritesh-ojha/IPL-DATASET GitHub repo
since cricsheet.org itself returns 403 from this environment's network
egress. Identity-duplicate merging is reimplemented here rather than
imported: build_full_data.py's merge helpers assume set-valued player
records (`players[full] |= players[ab]`), but this script needs to merge
nested {team: {seasons}} maps (plus a parallel match-count tally) instead.

Deliberately launches with only the TOP_N most-played players rather than
the full ~800-player pool: a career-path puzzle on someone nobody
recognizes isn't a fun puzzle, so it's better to ship a small, high-quality
set and raise TOP_N later once this has been played/checked over than to
dump every match-parsed name in on day one.
"""
import glob
import json
from collections import Counter, defaultdict

from build_full_data import parse_matches, MATCHES_DIR, _is_abbreviated, _surname_of

OUTPUT_PATH = "server/data/career-path.json"

TOP_N = 50
MIN_SEASONS_SINGLE_TEAM = 5
MIN_TEAMS = 2
# A player who hops teams almost every season (rather than settling into a
# handful of real stints) is usually a fringe/bench player who happened to
# make one playing-XI appearance per team, not someone a fan would
# recognize - exclude them from this small launch set rather than let a
# high raw match count paper over that. Revisit once TOP_N grows.
MAX_BLOCKS = 5


def season_sort_key(s):
    try:
        return int(s[:4])
    except ValueError:
        return 0


def count_match_appearances():
    """id -> number of distinct matches a player appeared in, used purely to
    rank players by how well-known they're likely to be."""
    counts = Counter()
    for fp in glob.glob(f"{MATCHES_DIR}/*.json"):
        try:
            with open(fp, encoding="utf-8") as f:
                d = json.load(f)
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        registry = d.get("info", {}).get("registry", {}).get("people", {})
        rosters = d.get("info", {}).get("players", {})
        pids = {registry[name] for roster in rosters.values() for name in roster if name in registry}
        for pid in pids:
            counts[pid] += 1
    return counts


def find_merges(players):
    merges = {}
    by_surname = defaultdict(list)
    for name in players:
        by_surname[_surname_of(name)].append(name)
    for names in by_surname.values():
        if len(names) < 2:
            continue
        abbrev = [n for n in names if _is_abbreviated(n)]
        full = [n for n in names if not _is_abbreviated(n)]
        for ab in abbrev:
            candidates = [f for f in full if f[0].lower() == ab[0].lower()]
            if len(candidates) == 1:
                merges[ab] = candidates[0]

    for name in list(players):
        toks = name.replace(".", " ").split()
        if len(toks) >= 3 and len(toks[0]) == 1 and toks[0].isalpha() and toks[0].isupper():
            rest = " ".join(toks[1:])
            if rest in players and rest != name and name not in merges:
                merges[name] = rest
    return merges


def apply_merges(players, merges, match_counts):
    for ab, full in merges.items():
        if ab not in players or full not in players:
            continue
        for team, seasons in players[ab].items():
            players[full].setdefault(team, set()).update(seasons)
        del players[ab]
        match_counts[full] = match_counts.get(full, 0) + match_counts.pop(ab, 0)


def build_blocks(team_seasons):
    """Flatten to (season, team) pairs and walk them in chronological
    order, starting a new block whenever the team changes - this captures
    real stints (e.g. a player who left and later rejoined the same team)
    instead of collapsing every season a player spent at a team into one
    span regardless of gaps."""
    pairs = []
    for team, seasons in team_seasons.items():
        for s in seasons:
            pairs.append((season_sort_key(s), s, team))
    pairs.sort(key=lambda p: (p[0], p[2]))

    blocks = []
    for _, season, team in pairs:
        if blocks and blocks[-1]["team"] == team:
            blocks[-1]["seasons"].append(season)
        else:
            blocks.append({"team": team, "seasons": [season]})
    return blocks


def build():
    id_to_teams, id_to_name, _id_to_seasons, id_to_team_seasons = parse_matches()
    match_counts_by_id = count_match_appearances()

    players = {}  # display name -> {team: set(seasons)}
    match_counts = {}  # display name -> match appearances
    for pid, _teams in id_to_teams.items():
        name = id_to_name[pid]
        team_seasons = id_to_team_seasons.get(pid, {})
        dest = players.setdefault(name, {})
        for team, seasons in team_seasons.items():
            dest.setdefault(team, set()).update(seasons)
        match_counts[name] = match_counts.get(name, 0) + match_counts_by_id.get(pid, 0)

    merges = find_merges(players)
    apply_merges(players, merges, match_counts)
    print(f"merged {len(merges)} duplicate identities")

    candidates = []
    for name, team_seasons in players.items():
        blocks = build_blocks(team_seasons)
        distinct_teams = len({b["team"] for b in blocks})
        total_seasons = len({s for seasons in team_seasons.values() for s in seasons})
        if distinct_teams < MIN_TEAMS and total_seasons < MIN_SEASONS_SINGLE_TEAM:
            continue
        if len(blocks) > MAX_BLOCKS:
            continue
        candidates.append({
            "name": name,
            "blocks": blocks,
            "totalSeasons": total_seasons,
            "matches": match_counts.get(name, 0),
        })

    candidates.sort(key=lambda e: (-e["matches"], e["name"]))
    entries = candidates[:TOP_N]
    for e in entries:
        del e["matches"]
    entries.sort(key=lambda e: e["name"])

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump({"players": entries}, f, indent=2, ensure_ascii=False)

    print(f"eligible players: {len(candidates)}, shipped top {len(entries)} by matches played")
    block_counts = defaultdict(int)
    for e in entries:
        block_counts[len(e["blocks"])] += 1
    print("distribution by #blocks (stints, not distinct teams):", dict(sorted(block_counts.items())))


if __name__ == "__main__":
    build()
