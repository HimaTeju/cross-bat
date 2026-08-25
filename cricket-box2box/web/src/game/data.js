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

// lowercase name -> canonical name, for case-insensitive exact lookup on guesses
export const nameIndex = new Map();
for (const name of players.keys()) {
  nameIndex.set(name.toLowerCase(), name);
}

export function searchPlayers(query, exclude = [], limit = 8) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const excludeSet = new Set(exclude.map((n) => n.toLowerCase()));
  const results = [];
  for (const name of players.keys()) {
    if (excludeSet.has(name.toLowerCase())) continue;
    if (name.toLowerCase().includes(q)) {
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

export function checkGuess(rowId, colId, rawName) {
  const canonical = nameIndex.get(rawName.trim().toLowerCase());
  if (!canonical) return { correct: false, reason: "unknown-player" };
  const v = players.get(canonical);
  if (!v.has(rowId) || !v.has(colId)) {
    return { correct: false, name: canonical, reason: "not-eligible" };
  }
  return { correct: true, name: canonical };
}
