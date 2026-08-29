# -*- coding: utf-8 -*-
"""
Matches the hand-verified season awards in awards_source.py against the
*live* player dataset (server/data/players.json - the same file the admin
panel reads and writes), using each player's alias list from the central
registry (build_player_registry.py) so a formal award-source name like
"Matthew Hayden" matches even when the game's display name is different
("ML Hayden") - and writes a staging file, server/data/awards-staged.json,
for a human to review in the admin UI.

This script never writes to players.json/gamedata.json's player data
directly - award tags only reach the live game data when an admin approves
a staged entry via the admin panel (server/src/data.js
adminApproveStagedAward). It only ensures the three award categories exist
in gamedata.json's categories list (adding them once, with zero players, if
missing) so the admin UI has something to point a staged entry at.

Re-running this script is safe/idempotent: it regenerates the staged file
from awards_source.py and the current players.json, but never touches
categories that already exist or players that already carry an award tag.
"""
import json
from collections import defaultdict

from build_full_data import fuzzy_key
from awards_source import ORANGE_CAP, PURPLE_CAP, MVP

PLAYERS_PATH = "server/data/players.json"
GAMEDATA_PATH = "server/data/gamedata.json"
STAGED_PATH = "server/data/awards-staged.json"

# (award key, categoryId, type, displayName, reputation, source table)
AWARD_CATEGORIES = [
    ("orange_cap", 500, 3, "Orange Cap", "Won the Orange Cap (leading run-scorer of an IPL season)", 60, ORANGE_CAP),
    ("purple_cap", 501, 4, "Purple Cap", "Won the Purple Cap (leading wicket-taker of an IPL season)", 60, PURPLE_CAP),
    ("mvp", 502, 5, "MVP", "Won the IPL Most Valuable Player award (Player of the Tournament, 2008-2012)", 65, MVP),
]


def ensure_categories(gamedata):
    categories = gamedata["gameData"]["categories"]
    existing_ids = {c["id"] for c in categories}
    added = []
    for _key, cat_id, cat_type, display_name, description, reputation, _table in AWARD_CATEGORIES:
        if cat_id in existing_ids:
            continue
        categories.append({
            "id": cat_id,
            "name": display_name,
            "reputation": reputation,
            "type": cat_type,
            "description": description,
            "displayName": display_name,
        })
        added.append(display_name)
    return added


def build_indexes(players_raw):
    """exact/fuzzy indexes keyed on every name a player is known by - their
    display name plus registry aliases (e.g. "ML Hayden" resolving to
    "Matthew Hayden") - all mapping back to the canonical display name."""
    exact = {}
    by_key = defaultdict(set)
    for p in players_raw["players"]:
        canonical = p["n"]
        for known_as in [canonical, *p.get("a", [])]:
            exact[known_as.lower()] = canonical
            k = fuzzy_key(known_as)
            if k:
                by_key[k].add(canonical)
    return exact, {k: sorted(v) for k, v in by_key.items()}


def match_name(raw_name, exact, by_key):
    lname = raw_name.lower()
    if lname in exact:
        return "exact", exact[lname], []
    key = fuzzy_key(raw_name)
    candidates = by_key.get(key, [])
    if len(candidates) == 1:
        return "fuzzy", candidates[0], []
    if len(candidates) > 1:
        return "ambiguous", None, candidates
    return "unmatched", None, []


def build():
    players_raw = json.load(open(PLAYERS_PATH, encoding="utf-8"))
    exact, by_key = build_indexes(players_raw)

    gamedata = json.load(open(GAMEDATA_PATH, encoding="utf-8"))
    added = ensure_categories(gamedata)

    entries = []
    entry_id = 1
    for award_key, cat_id, _cat_type, display_name, _desc, _rep, table in AWARD_CATEGORIES:
        for season in sorted(table):
            rec = table[season]
            name, team, stat = rec[0], rec[1], rec[2]
            note = rec[3] if len(rec) > 3 else None
            match_type, matched_name, candidates = match_name(name, exact, by_key)
            entries.append({
                "id": entry_id,
                "award": award_key,
                "categoryId": cat_id,
                "awardLabel": display_name,
                "season": season,
                "rawName": name,
                "team": team,
                "stat": stat,
                "note": note,
                "matchType": match_type,
                "matchedName": matched_name,
                "candidates": candidates,
                "status": "pending",
            })
            entry_id += 1

    with open(GAMEDATA_PATH, "w", encoding="utf-8") as f:
        json.dump(gamedata, f, indent=2, ensure_ascii=False)

    with open(STAGED_PATH, "w", encoding="utf-8") as f:
        json.dump({"entries": entries}, f, indent=2, ensure_ascii=False)

    counts = defaultdict(int)
    for e in entries:
        counts[e["matchType"]] += 1

    print("added categories:", added or "(none, already present)")
    print("staged award entries:", len(entries))
    for k, v in counts.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    build()
