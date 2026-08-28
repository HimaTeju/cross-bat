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

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// Same puzzle for everyone on a given UTC calendar day.
export function dailyPuzzle(date = new Date()) {
  const dateKey = date.toISOString().slice(0, 10);
  const index = hashString(dateKey) % players.length;
  return { player: players[index], dateKey };
}

export function randomPuzzle(excludeName) {
  if (players.length <= 1) return players[0];
  let p;
  do {
    p = players[Math.floor(Math.random() * players.length)];
  } while (p.name === excludeName);
  return p;
}
