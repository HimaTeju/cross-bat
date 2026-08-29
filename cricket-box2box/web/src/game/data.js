import gamedataRaw from "../../../server/data/gamedata.json";
import playersRaw from "../../../server/data/players.json";

export const gameData = gamedataRaw.gameData;

export const categories = gameData.categories;
export const categoryById = new Map(categories.map((c) => [c.id, c]));

export const adjacency = new Map(
  Object.entries(gameData.playableCombos).map(([k, v]) => [Number(k), new Set(v)])
);

// players: name -> Set<categoryId>
export const players = new Map(playersRaw.players.map((p) => [p.n, new Set(p.v)]));

// name -> alternate name spellings ("RG Sharma" for "Rohit Sharma") a guess
// or search query might still use - see server/data/player-registry.json.
const aliasesByName = new Map(playersRaw.players.map((p) => [p.n, p.a || []]));

// lowercase name/alias -> canonical name, for case-insensitive lookup on
// guesses and search, so typing an old abbreviated form still resolves.
export const nameIndex = new Map();
for (const [name, aliases] of aliasesByName) {
  nameIndex.set(name.toLowerCase(), name);
  for (const alias of aliases) nameIndex.set(alias.toLowerCase(), name);
}

export function searchPlayers(query, exclude = [], limit = 8) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const excludeSet = new Set(exclude.map((n) => n.toLowerCase()));
  const results = [];
  for (const name of players.keys()) {
    if (excludeSet.has(name.toLowerCase())) continue;
    const aliases = aliasesByName.get(name) || [];
    const matches = name.toLowerCase().includes(q) || aliases.some((a) => a.toLowerCase().includes(q));
    if (matches) {
      results.push(name);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function answerCount(catA, catB) {
  let count = 0;
  for (const v of players.values()) {
    if (v.has(catA) && v.has(catB)) count++;
  }
  return count;
}

// Adjacency restricted to pairs whose answerCount falls within [min, max].
export function adjacencyForRange(min, max) {
  const filtered = new Map();
  for (const [a, set] of adjacency) {
    for (const b of set) {
      const count = answerCount(a, b);
      if (count >= min && count <= max) {
        if (!filtered.has(a)) filtered.set(a, new Set());
        filtered.get(a).add(b);
      }
    }
  }
  return filtered;
}

export function checkGuess(rowId, colId, rawName) {
  const canonical = nameIndex.get(rawName.trim().toLowerCase());
  if (!canonical) return { correct: false, reason: "unknown-player" };
  const v = players.get(canonical);
  if (!v.has(rowId) || !v.has(colId)) {
    return { correct: false, name: canonical, reason: "not-eligible" };
  }
  return { correct: true, name: canonical };
}
