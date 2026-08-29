# -*- coding: utf-8 -*-
"""
Builds server/data/player-registry.json: the single source of truth mapping
each stable Cricsheet registry id ("pid") to one canonical display name, the
alias name strings ever seen for that person, and their nation.

Every other build script (build_full_data.py, build_career_path_data.py,
build_squad_builder_data.py, build_awards_data.py) resolves player identity
through this registry via load_registry() instead of independently voting on
/ merging names off the raw Cricsheet rosters - that inconsistency (the same
player showing up as "RG Sharma" in one game and "Rohit Sharma" in another)
is exactly why this file exists. Any future game's build script should do
the same: call load_registry() and look players up by pid, don't reinvent
name matching.

Resolution priority per pid (or per merged group of pids), highest first:
  1. An explicit entry in player_name_overrides.json - the escape hatch for
     cases the automatic passes below get wrong or can't disambiguate, e.g.
     a real player whose IPL career got split across two Cricsheet ids (see
     that file for the Rohit Sharma example and its schema).
  2. A verified full name from build_data.py's hand-curated squads
     (SQUADS/SQUADS_2022/LEGENDS), matched by surname + first-initial
     (fuzzy_key) - but ONLY when exactly one verified name shares that key.
     Ambiguous keys (e.g. the several different "R Sharma"s in IPL squads)
     are left unresolved here rather than risk a wrong automatic merge; run
     this script directly (`python build_player_registry.py`) to print any
     such groups so a human can add an override if one is actually needed.
  3. The plain Cricsheet-voted name (the most common roster spelling) - the
     same fallback every build script used before this registry existed.
"""
import json
from collections import Counter, defaultdict

from build_data import DROP_NAMES
from build_full_data import parse_matches, fuzzy_key, build_nation_lookup

OUTPUT_PATH = "server/data/player-registry.json"
OVERRIDES_PATH = "player_name_overrides.json"


def load_overrides():
    try:
        with open(OVERRIDES_PATH, encoding="utf-8") as f:
            return json.load(f).get("merges", [])
    except FileNotFoundError:
        return []


def _verified_fullname_by_key(raw_nation_names):
    """fuzzy_key -> verified full name, only for keys with exactly one
    distinct name on file across SQUADS/SQUADS_2022/LEGENDS (see priority 2
    in the module docstring)."""
    key_to_names = defaultdict(set)
    for name in raw_nation_names:
        k = fuzzy_key(name)
        if k:
            key_to_names[k].add(name)
    return {k: next(iter(v)) for k, v in key_to_names.items() if len(v) == 1}


def _resolve_name(pids, explicit_name, id_to_name, id_to_name_votes, verified_fullname):
    if explicit_name:
        return explicit_name
    candidates = {verified_fullname[k] for pid in pids
                  if (k := fuzzy_key(id_to_name[pid])) in verified_fullname}
    if len(candidates) == 1:
        return next(iter(candidates))
    votes = Counter()
    for pid in pids:
        votes.update(id_to_name_votes[pid])
    return votes.most_common(1)[0][0]


def _print_unresolved_ambiguous_groups(id_to_teams, id_to_name, id_to_seasons, merged_pids):
    """Diagnostic only: same surname+initial, more than one pid, not already
    covered by an override - candidates for a future entry in
    player_name_overrides.json if they really are the same person split
    across ids (check season overlap, like the Rohit Sharma example)."""
    by_key = defaultdict(list)
    for pid in id_to_teams:
        if pid in merged_pids:
            continue
        by_key[fuzzy_key(id_to_name[pid])].append(pid)
    groups = {k: v for k, v in by_key.items() if len(v) > 1}
    if not groups:
        return
    print(f"NOTE {len(groups)} unresolved same-surname/initial pid groups (not merged, review if needed):")
    for k, pids in sorted(groups.items()):
        detail = ", ".join(
            f"{pid}={id_to_name[pid]!r}({len(id_to_seasons.get(pid, ()))}s)" for pid in pids
        )
        print(f"  {k}: {detail}")


def build_registry():
    id_to_teams, id_to_name, id_to_seasons, _id_to_team_seasons, id_to_name_votes = parse_matches()
    nation_lookup, raw_nation_names = build_nation_lookup()
    verified_fullname = _verified_fullname_by_key(raw_nation_names)

    id_to_entry = {}  # every pid (including ones folded into a merge) -> shared entry dict
    merged_pids = set()

    for merge in load_overrides():
        pids = set(merge["pids"]) & set(id_to_teams)
        if not pids:
            continue
        name = _resolve_name(pids, merge.get("name"), id_to_name, id_to_name_votes, verified_fullname)
        if name in DROP_NAMES:
            continue
        aliases = set()
        for pid in pids:
            aliases.update(id_to_name_votes[pid])
        canonical_pid = min(pids)
        entry = {
            "id": canonical_pid,
            "name": name,
            "aliases": sorted(aliases - {name}),
            "nation": nation_lookup.get(fuzzy_key(name)),
        }
        for pid in pids:
            id_to_entry[pid] = entry
            merged_pids.add(pid)

    for pid in id_to_teams:
        if pid in id_to_entry:
            continue
        name = _resolve_name({pid}, None, id_to_name, id_to_name_votes, verified_fullname)
        if name in DROP_NAMES:
            continue
        aliases = set(id_to_name_votes[pid]) - {name}
        id_to_entry[pid] = {
            "id": pid,
            "name": name,
            "aliases": sorted(aliases),
            "nation": nation_lookup.get(fuzzy_key(name)),
        }

    _print_unresolved_ambiguous_groups(id_to_teams, id_to_name, id_to_seasons, merged_pids)
    return id_to_entry


def load_registry():
    """pid -> {"id": canonical pid, "name", "aliases", "nation"}, for every
    pid that appeared in a match - including pids folded into a merged
    identity, which resolve to the same shared entry as the pid(s) they were
    merged with. This is what other build scripts should import and use."""
    return build_registry()


def build():
    id_to_entry = build_registry()
    unique_entries = {entry["id"]: entry for entry in id_to_entry.values()}.values()
    out = {
        "players": sorted(unique_entries, key=lambda e: e["name"]),
    }
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    with_nation = sum(1 for e in unique_entries if e.get("nation"))
    print(f"registry entries: {len(out['players'])} (pids covered: {len(id_to_entry)})")
    print(f"entries with a nation tag: {with_nation}")


if __name__ == "__main__":
    build()
