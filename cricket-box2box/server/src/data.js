import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GAMEDATA_PATH = join(__dirname, "../data/gamedata.json");
const PLAYERS_PATH = join(__dirname, "../data/players.json");

const gamedataRaw = JSON.parse(readFileSync(GAMEDATA_PATH, "utf-8"));
const playersRaw = JSON.parse(readFileSync(PLAYERS_PATH, "utf-8"));

export const gameData = gamedataRaw.gameData;

export const categories = gameData.categories;
export const categoryById = new Map(categories.map((c) => [c.id, c]));

export let adjacency = new Map(
  Object.entries(gameData.playableCombos).map(([k, v]) => [Number(k), new Set(v)])
);

// players: name -> Set<categoryId>
export const players = new Map(
  playersRaw.players.map((p) => [p.n, new Set(p.v)])
);

// name -> string[] of IPL season labels the player actually appeared in
// (from Cricsheet match data). Empty for players added by hand with no
// match history (brand-new signings, or admin-created entries).
export const playerSeasons = new Map(
  playersRaw.players.map((p) => [p.n, p.s || []])
);

// lowercase name -> canonical name, for case-insensitive exact lookup on guesses
export const nameIndex = new Map();
for (const name of players.keys()) {
  nameIndex.set(name.toLowerCase(), name);
}

// ---------- Admin: mutation, recompute, persistence ----------

function recomputePlayableCombos() {
  const { minimumComboAnswers, maximumComboAnswers, minimumComboReputation, maximumComboReputation } =
    gameData.difficulty;
  const repById = new Map(categories.map((c) => [c.id, c.reputation]));
  const allIds = categories.map((c) => c.id);

  const posting = new Map(allIds.map((id) => [id, new Set()]));
  for (const [name, catSet] of players) {
    for (const cid of catSet) {
      if (posting.has(cid)) posting.get(cid).add(name);
    }
  }

  const playable = new Map(allIds.map((id) => [id, new Set()]));
  for (let i = 0; i < allIds.length; i++) {
    for (let j = i + 1; j < allIds.length; j++) {
      const a = allIds[i];
      const b = allIds[j];
      let count = 0;
      const smaller = posting.get(a).size < posting.get(b).size ? posting.get(a) : posting.get(b);
      const larger = smaller === posting.get(a) ? posting.get(b) : posting.get(a);
      for (const name of smaller) {
        if (larger.has(name)) count++;
      }
      const repSum = repById.get(a) + repById.get(b);
      if (
        count >= minimumComboAnswers &&
        count <= maximumComboAnswers &&
        repSum >= minimumComboReputation &&
        repSum <= maximumComboReputation
      ) {
        playable.get(a).add(b);
        playable.get(b).add(a);
      }
    }
  }

  adjacency = new Map([...playable].filter(([, v]) => v.size > 0));
  gameData.playableCombos = Object.fromEntries(
    [...adjacency].map(([k, v]) => [String(k), [...v]])
  );
}

function persist() {
  writeFileSync(GAMEDATA_PATH, JSON.stringify({ gameData }, null, 2), "utf-8");
  const playersOut = {
    players: [...players]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([n, v]) => ({ n, v: [...v].sort((a, b) => a - b), s: playerSeasons.get(n) || [] })),
  };
  writeFileSync(PLAYERS_PATH, JSON.stringify(playersOut, null, 2), "utf-8");
}

function rebuildNameIndex() {
  nameIndex.clear();
  for (const name of players.keys()) {
    nameIndex.set(name.toLowerCase(), name);
  }
}

function validateCategoryIds(categoryIds) {
  if (!Array.isArray(categoryIds) || categoryIds.some((id) => typeof id !== "number")) {
    throw new AdminError("categoryIds must be an array of numbers");
  }
  const unknown = categoryIds.filter((id) => !categoryById.has(id));
  if (unknown.length) {
    throw new AdminError(`unknown category ids: ${unknown.join(", ")}`);
  }
  const nationCount = categoryIds.filter((id) => categoryById.get(id).type === 1).length;
  if (nationCount > 1) {
    throw new AdminError("a player can only have one nation tag");
  }
}

export class AdminError extends Error {}

export function adminListPlayers() {
  return [...players]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, v]) => ({
      name,
      categoryIds: [...v].sort((a, b) => a - b),
      seasons: playerSeasons.get(name) || [],
    }));
}

export function adminCreatePlayer(name, categoryIds) {
  const trimmed = (name || "").trim();
  if (!trimmed) throw new AdminError("name is required");
  if (players.has(trimmed)) throw new AdminError(`"${trimmed}" already exists`);
  validateCategoryIds(categoryIds);
  players.set(trimmed, new Set(categoryIds));
  playerSeasons.set(trimmed, []);
  rebuildNameIndex();
  recomputePlayableCombos();
  persist();
  return { name: trimmed, categoryIds: [...players.get(trimmed)].sort((a, b) => a - b) };
}

export function adminUpdatePlayer(currentName, { name, categoryIds }) {
  if (!players.has(currentName)) throw new AdminError(`"${currentName}" not found`);
  const nextName = (name ?? currentName).trim();
  if (!nextName) throw new AdminError("name is required");
  if (nextName !== currentName && players.has(nextName)) {
    throw new AdminError(`"${nextName}" already exists`);
  }
  validateCategoryIds(categoryIds);
  const existingSeasons = playerSeasons.get(currentName) || [];
  players.delete(currentName);
  playerSeasons.delete(currentName);
  players.set(nextName, new Set(categoryIds));
  playerSeasons.set(nextName, existingSeasons);
  rebuildNameIndex();
  recomputePlayableCombos();
  persist();
  return { name: nextName, categoryIds: [...players.get(nextName)].sort((a, b) => a - b) };
}

export function adminDeletePlayer(name) {
  if (!players.has(name)) throw new AdminError(`"${name}" not found`);
  players.delete(name);
  playerSeasons.delete(name);
  rebuildNameIndex();
  recomputePlayableCombos();
  persist();
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
