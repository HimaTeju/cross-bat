# -*- coding: utf-8 -*-
"""
Builds the "complete IPL history" dataset by combining:
  1. Cricsheet ball-by-ball match data (cricsheet/matches/*.json) - every player
     who ever appeared in a playing XI, across all 1243 IPL matches 2008-2026,
     for all 15 franchises that have ever existed (10 active + 5 defunct).
     This gives complete, accurate franchise<->franchise history.
  2. A verified nationality lookup (reused from build_data.py's hand-checked
     SQUADS/SQUADS_2022/LEGENDS, sourced from Wikipedia + web-search fact
     checks) fuzzy-matched onto the cricsheet player pool by surname+initial.
     Players with no confident nationality match simply get no nation tag -
     they're still usable for franchise<->franchise grid cells.
"""
import json
import glob
import re
from collections import Counter, defaultdict

from build_data import SQUADS, SQUADS_2022, LEGENDS, NATION_FIX, NATIONS, DROP_NAMES

MATCHES_DIR = "cricsheet/matches"

TEAM_CANON = {
    "Mumbai Indians": "Mumbai Indians",
    "Kolkata Knight Riders": "Kolkata Knight Riders",
    "Chennai Super Kings": "Chennai Super Kings",
    "Rajasthan Royals": "Rajasthan Royals",
    "Royal Challengers Bangalore": "Royal Challengers Bengaluru",
    "Royal Challengers Bengaluru": "Royal Challengers Bengaluru",
    "Sunrisers Hyderabad": "Sunrisers Hyderabad",
    "Kings XI Punjab": "Punjab Kings",
    "Punjab Kings": "Punjab Kings",
    "Delhi Daredevils": "Delhi Capitals",
    "Delhi Capitals": "Delhi Capitals",
    "Gujarat Titans": "Gujarat Titans",
    "Deccan Chargers": "Deccan Chargers",
    "Lucknow Super Giants": "Lucknow Super Giants",
    "Pune Warriors": "Pune Warriors",
    "Gujarat Lions": "Gujarat Lions",
    "Rising Pune Supergiant": "Rising Pune Supergiant",
    "Rising Pune Supergiants": "Rising Pune Supergiant",
    "Kochi Tuskers Kerala": "Kochi Tuskers Kerala",
}

# (name, displayName, reputation, active)
FRANCHISES_FULL = [
    ("Mumbai Indians", "MI", 100, True),
    ("Chennai Super Kings", "CSK", 95, True),
    ("Royal Challengers Bengaluru", "RCB", 90, True),
    ("Kolkata Knight Riders", "KKR", 85, True),
    ("Delhi Capitals", "DC", 55, True),
    ("Punjab Kings", "PBKS", 55, True),
    ("Rajasthan Royals", "RR", 70, True),
    ("Sunrisers Hyderabad", "SRH", 65, True),
    ("Gujarat Titans", "GT", 75, True),
    ("Lucknow Super Giants", "LSG", 50, True),
    ("Deccan Chargers", "DCH", 35, False),
    ("Pune Warriors", "PWI", 30, False),
    ("Gujarat Lions", "GL", 30, False),
    ("Rising Pune Supergiant", "RPS", 30, False),
    ("Kochi Tuskers Kerala", "KTK", 25, False),
]

SURNAME_PARTICLES = {"de", "van", "der", "du", "von", "bin", "al", "abu"}


def fuzzy_key(full_name):
    """surname + first-initial, keeping particles (de/van/der/...) attached to the surname."""
    parts = full_name.replace(".", " ").split()
    if not parts:
        return None
    initial = parts[0][0].lower()
    # walk backward, absorbing particle words into the surname
    surname_parts = [parts[-1]]
    i = len(parts) - 2
    while i > 0 and parts[i].lower() in SURNAME_PARTICLES:
        surname_parts.insert(0, parts[i])
        i -= 1
    surname = " ".join(surname_parts).lower()
    return f"{initial}|{surname}"


def build_nation_lookup():
    raw = {}
    for franchise, roster in SQUADS.items():
        for name, nation in roster:
            raw[name] = NATION_FIX.get(nation, nation)
    for franchise, roster in SQUADS_2022.items():
        for name, nation in roster:
            raw[name] = NATION_FIX.get(nation, nation)
    for name, (nation, _fr) in LEGENDS.items():
        raw[name] = nation

    valid_nations = {n for n, _ in NATIONS}
    key_to_nations = defaultdict(set)
    key_to_fullname = {}
    for name, nation in raw.items():
        if nation not in valid_nations:
            continue
        k = fuzzy_key(name)
        if not k:
            continue
        key_to_nations[k].add(nation)
        key_to_fullname[k] = name

    # drop ambiguous keys (same surname+initial, different nation on file)
    lookup = {k: next(iter(v)) for k, v in key_to_nations.items() if len(v) == 1}
    return lookup, raw


def parse_matches():
    id_to_teams = defaultdict(set)
    id_to_name_votes = defaultdict(Counter)
    id_to_seasons = defaultdict(set)
    id_to_team_seasons = defaultdict(lambda: defaultdict(set))
    match_files = glob.glob(f"{MATCHES_DIR}/*.json")
    n_matches = 0
    unknown_teams = Counter()

    for fp in match_files:
        try:
            with open(fp, encoding="utf-8") as f:
                d = json.load(f)
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        info = d.get("info", {})
        players = info.get("players", {})
        registry = info.get("registry", {}).get("people", {})
        if not players or not registry:
            continue
        n_matches += 1
        season = str(info.get("season", "")) or None
        for raw_team, roster in players.items():
            canon = TEAM_CANON.get(raw_team)
            if not canon:
                unknown_teams[raw_team] += 1
                continue
            for display_name in roster:
                pid = registry.get(display_name)
                if not pid:
                    continue
                id_to_teams[pid].add(canon)
                id_to_name_votes[pid][display_name] += 1
                if season:
                    id_to_seasons[pid].add(season)
                    id_to_team_seasons[pid][canon].add(season)

    id_to_name = {pid: votes.most_common(1)[0][0] for pid, votes in id_to_name_votes.items()}
    print(f"parsed {n_matches} matches, {len(id_to_teams)} unique players")
    if unknown_teams:
        print("WARN unmapped team names:", dict(unknown_teams))
    return id_to_teams, id_to_name, id_to_seasons, id_to_team_seasons


def _split_name(name):
    """Split into (given-name tokens, surname tokens), keeping particle words
    (de/van/der/...) attached to the surname rather than the given-name part -
    otherwise "Q de Kock" reads as abbreviated=["Q","de"] and fails the
    all-uppercase check on "de"."""
    toks = name.replace(".", " ").split()
    surname_parts = [toks[-1]]
    i = len(toks) - 2
    while i > 0 and toks[i].lower() in SURNAME_PARTICLES:
        surname_parts.insert(0, toks[i])
        i -= 1
    return toks[: i + 1], surname_parts


def _is_abbreviated(name):
    given, _surname = _split_name(name)
    if not given:
        return False
    return all(t.isalpha() and t.isupper() for t in given)


def _surname_of(name):
    _given, surname_parts = _split_name(name)
    return " ".join(surname_parts).lower()


def _apply_merges(merges, players, *companions):
    for ab, full in merges.items():
        players[full] |= players[ab]
        del players[ab]
        for comp in companions:
            if ab in comp:
                comp[full] = comp.get(full, set()) | comp[ab]
                del comp[ab]


def merge_duplicate_identities(players, *companions):
    """Cricsheet sometimes assigns two different registry ids to the same real
    player (e.g. one season tagged "AF Milne", another tagged "Adam Milne"),
    which splits their team history across two entries. Merge an abbreviated
    ("AF Milne") entry into a full-name ("Adam Milne") entry when they share a
    surname and first initial AND there is exactly one candidate on each side -
    same ambiguity-rejection rule used for the nationality lookup, to avoid
    merging two genuinely different people who happen to share initials.
    Any extra dict passed as `companions` (e.g. per-player season sets) is
    merged in lockstep so split identities don't also split their metadata."""
    by_surname = defaultdict(list)
    for name in players:
        by_surname[_surname_of(name)].append(name)

    merges = {}
    for surname, names in by_surname.items():
        if len(names) < 2:
            continue
        abbrev = [n for n in names if _is_abbreviated(n)]
        full = [n for n in names if not _is_abbreviated(n)]
        if not abbrev or not full:
            continue
        for ab in abbrev:
            ab_initial = ab[0].lower()
            candidates = [f for f in full if f[0].lower() == ab_initial]
            if len(candidates) == 1:
                merges[ab] = candidates[0]

    _apply_merges(merges, players, *companions)
    return merges


def merge_dropped_initial(players, *companions):
    """A second, narrower duplicate pattern: a player commonly known without
    their first (given) initial, e.g. "B Sai Sudharsan" vs "Sai Sudharsan" or
    "M Shahrukh Khan" vs "Shahrukh Khan". Exact-match after stripping the
    leading single-letter token, so there's no ambiguity to reject."""
    merges = {}
    for name in players:
        toks = name.replace(".", " ").split()
        if len(toks) >= 3 and len(toks[0]) == 1 and toks[0].isalpha() and toks[0].isupper():
            rest = " ".join(toks[1:])
            if rest in players and rest != name:
                merges[name] = rest

    _apply_merges(merges, players, *companions)
    return merges


def build():
    nation_id = {name: 100 + i for i, (name, _) in enumerate(NATIONS)}
    franchise_id = {name: 300 + i for i, (name, _, _, _) in enumerate(FRANCHISES_FULL)}

    categories = []
    for name, rep in NATIONS:
        categories.append({
            "id": nation_id[name], "name": name, "reputation": rep,
            "type": 1, "description": name, "displayName": name,
        })
    for name, disp, rep, active in FRANCHISES_FULL:
        categories.append({
            "id": franchise_id[name], "name": name, "reputation": rep,
            "type": 2, "description": name, "displayName": disp, "active": active,
        })

    nation_lookup, raw_nation_names = build_nation_lookup()
    id_to_teams, id_to_name, id_to_seasons, _id_to_team_seasons = parse_matches()

    players = {}  # display name -> set of category ids
    seasons = {}  # display name -> set of season strings the player actually appeared in

    for pid, teams in id_to_teams.items():
        name = id_to_name[pid]
        if name in DROP_NAMES:
            continue
        v = set()
        for t in teams:
            v.add(franchise_id[t])
        key = fuzzy_key(name)
        nation = nation_lookup.get(key)
        if nation:
            v.add(nation_id[nation])
        # de-dupe: if this exact display name already exists (shouldn't normally,
        # ids are supposed to be unique per person), merge rather than overwrite
        if name in players:
            players[name] |= v
            seasons[name] |= id_to_seasons.get(pid, set())
        else:
            players[name] = v
            seasons[name] = set(id_to_seasons.get(pid, set()))

    # players in our verified nation lists who never matched a cricsheet id at all
    # (e.g. brand-new signings with no match history yet) - add them directly
    # using their most recent known franchise from the 2026 current squads. They
    # have no match-derived season history, so they get an empty season set.
    for franchise, roster in SQUADS.items():
        for name, nation_raw in roster:
            if name in DROP_NAMES or name in players:
                continue
            nation = NATION_FIX.get(nation_raw, nation_raw)
            if nation not in nation_id:
                continue
            players[name] = {nation_id[nation], franchise_id[franchise]}
            seasons[name] = set()

    # merge split identities - this must run after the current-squad supplement
    # above, since most duplicates are cross-source: cricsheet only recorded an
    # abbreviated form ("A Nortje") with the full historical team tags, while the
    # hand-curated current-squad data adds the full name ("Anrich Nortje") as a
    # seemingly-new player with only their current franchise + nation. `seasons`
    # is passed through so a merged player's career span merges along with it.
    merges = merge_duplicate_identities(players, seasons)
    merges2 = merge_dropped_initial(players, seasons)
    print(f"merged {len(merges)} split identities (e.g. initials-only + full-name duplicates)")
    print(f"merged {len(merges2)} dropped-initial duplicates (e.g. \"B Sai Sudharsan\" + \"Sai Sudharsan\")")

    difficulty = {
        "minimumComboAnswers": 4,
        "maximumComboAnswers": 250,
        "minimumComboReputation": 0,
        "maximumComboReputation": 999,
        "ignoreExcludedCategories": False,
        "includedCategories": [],
        "excludedCategories": [],
    }

    all_ids = [c["id"] for c in categories]
    rep_by_id = {c["id"]: c["reputation"] for c in categories}

    # build id -> set(players) posting lists for fast pairwise counts
    posting = defaultdict(set)
    for name, v in players.items():
        for cid in v:
            posting[cid].add(name)

    playable = {str(cid): [] for cid in all_ids}
    checked = set()
    for a in all_ids:
        for b in all_ids:
            if a == b or (a, b) in checked:
                continue
            checked.add((a, b))
            checked.add((b, a))
            cnt = len(posting[a] & posting[b])
            if cnt == 0:
                continue
            rep_sum = rep_by_id[a] + rep_by_id[b]
            if (difficulty["minimumComboAnswers"] <= cnt <= difficulty["maximumComboAnswers"]
                    and difficulty["minimumComboReputation"] <= rep_sum <= difficulty["maximumComboReputation"]):
                playable[str(a)].append(b)
                playable[str(b)].append(a)

    playable = {k: v for k, v in playable.items() if v}

    gamedata = {
        "gameData": {
            "lastUpdated": "22 Aug 2026",
            "game": "cricket-full",
            "difficulty": difficulty,
            "categories": categories,
            "playableCombos": playable,
        }
    }
    def season_sort_key(s):
        try:
            return int(s[:4])
        except ValueError:
            return 0

    players_out = {
        "players": [
            {"n": name, "v": sorted(v), "s": sorted(seasons.get(name, set()), key=season_sort_key)}
            for name, v in sorted(players.items())
        ]
    }

    with open("cricket-gamedata-full.json", "w", encoding="utf-8") as f:
        json.dump(gamedata, f, indent=2, ensure_ascii=False)
    with open("cricket-players-full.json", "w", encoding="utf-8") as f:
        json.dump(players_out, f, indent=2, ensure_ascii=False)

    nation_tagged = sum(1 for v in players.values() if any(i in nation_id.values() for i in v))
    all_seasons = sorted({s for v in seasons.values() for s in v}, key=season_sort_key)
    print("total players:", len(players))
    print("players with a nation tag:", nation_tagged)
    print("categories:", len(categories))
    print("playable category-rows:", len(playable))
    print("playable pairs (undirected):", sum(len(v) for v in playable.values()) // 2)
    print(f"seasons covered: {all_seasons[0]}..{all_seasons[-1]} ({len(all_seasons)} distinct)")


if __name__ == "__main__":
    build()
