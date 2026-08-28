# -*- coding: utf-8 -*-
"""
Builds server/data/career-path.json for the "Career Path" mini-game: for
every player with enough IPL history to make a fair puzzle, the
chronological sequence of franchises they played for (grouped into
contiguous team-tenure blocks, each with the seasons they were there), so
the game can reveal one block at a time, oldest first.

Reuses the same match-parsing pipeline as build_full_data.py
(parse_matches(), TEAM_CANON) over the real Cricsheet-format match data in
cricsheet/matches/ - mirrored from the ritesh-ojha/IPL-DATASET GitHub repo
since cricsheet.org itself returns 403 from this environment's network
egress. Identity-duplicate merging is reimplemented here rather than
imported: build_full_data.py's merge helpers assume set-valued player
records (`players[full] |= players[ab]`), but this script needs to merge
nested {team: {seasons}} maps team-by-team instead.
"""
import json
from collections import defaultdict

from build_full_data import parse_matches, _is_abbreviated, _surname_of

OUTPUT_PATH = "server/data/career-path.json"

MIN_SEASONS_SINGLE_TEAM = 5
MIN_BLOCKS = 2


def season_sort_key(s):
    try:
        return int(s[:4])
    except ValueError:
        return 0


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


def apply_merges(players, merges):
    for ab, full in merges.items():
        if ab not in players or full not in players:
            continue
        for team, seasons in players[ab].items():
            players[full].setdefault(team, set()).update(seasons)
        del players[ab]


def build_blocks(team_seasons):
    blocks = []
    for team, seasons in team_seasons.items():
        ordered = sorted(seasons, key=season_sort_key)
        if not ordered:
            continue
        blocks.append({"team": team, "seasons": ordered, "_first": season_sort_key(ordered[0])})
    blocks.sort(key=lambda b: b["_first"])
    for b in blocks:
        del b["_first"]
    return blocks


def build():
    id_to_teams, id_to_name, _id_to_seasons, id_to_team_seasons = parse_matches()

    players = {}  # display name -> {team: set(seasons)}
    for pid, _teams in id_to_teams.items():
        name = id_to_name[pid]
        team_seasons = id_to_team_seasons.get(pid, {})
        dest = players.setdefault(name, {})
        for team, seasons in team_seasons.items():
            dest.setdefault(team, set()).update(seasons)

    merges = find_merges(players)
    apply_merges(players, merges)
    print(f"merged {len(merges)} duplicate identities")

    entries = []
    for name, team_seasons in players.items():
        blocks = build_blocks(team_seasons)
        total_seasons = len({s for seasons in team_seasons.values() for s in seasons})
        if len(blocks) < MIN_BLOCKS and total_seasons < MIN_SEASONS_SINGLE_TEAM:
            continue
        entries.append({"name": name, "blocks": blocks, "totalSeasons": total_seasons})

    entries.sort(key=lambda e: e["name"])

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump({"players": entries}, f, indent=2, ensure_ascii=False)

    block_counts = defaultdict(int)
    for e in entries:
        block_counts[len(e["blocks"])] += 1
    print("career-path players:", len(entries))
    print("distribution by #teams:", dict(sorted(block_counts.items())))


if __name__ == "__main__":
    build()
