import dataRaw from "../../../server/data/career-path.json";

// [{ name, blocks: [{ team, seasons: [...] }], totalSeasons }]
export const players = dataRaw.players;

export function searchCareerPlayers(query, exclude = [], limit = 8) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const excludeSet = new Set(exclude.map((n) => n.toLowerCase()));
  const results = [];
  for (const p of players) {
    if (excludeSet.has(p.name.toLowerCase())) continue;
    if (p.name.toLowerCase().includes(q)) {
      results.push(p.name);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function randomPuzzle(excludeName) {
  if (players.length <= 1) return players[0];
  let p;
  do {
    p = players[Math.floor(Math.random() * players.length)];
  } while (p.name === excludeName);
  return p;
}
