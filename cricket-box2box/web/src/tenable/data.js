import tenableRaw from "../../../server/data/tenable.json";
import playersRaw from "../../../server/data/players.json";

// [{ id, label, description, unit, tieCaveat, answers: [{rank, name, id, a, value}] }]
export const categories = tenableRaw.categories;

export const LIVES = 3;

const players = playersRaw.players.map((p) => ({ name: p.n, a: p.a || [] }));

export function searchPlayers(query, exclude = [], limit = 8) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const excludeSet = new Set(exclude.map((n) => n.toLowerCase()));
  const results = [];
  for (const p of players) {
    if (excludeSet.has(p.name.toLowerCase())) continue;
    const matches = p.name.toLowerCase().includes(q) || p.a.some((a) => a.toLowerCase().includes(q));
    if (matches) {
      results.push(p.name);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function randomCategory(excludeId) {
  if (categories.length <= 1) return categories[0];
  let c;
  do {
    c = categories[Math.floor(Math.random() * categories.length)];
  } while (c.id === excludeId);
  return c;
}
