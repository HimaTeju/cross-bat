import dataRaw from "../../../server/data/squad-builder.json";

// [{ name, team, role, runs, wickets, matches, trophies }]
export const players = dataRaw.players;
export const calibration = dataRaw.calibration;
export const SLOTS = calibration.slots;
export const SQUAD_SIZE = calibration.squadSize;

export const CATEGORIES = [
  { key: "runs", label: "Most Runs", unit: "runs" },
  { key: "wickets", label: "Most Wickets", unit: "wickets" },
  { key: "matches", label: "Most Caps", unit: "caps" },
  { key: "trophies", label: "Most IPL Trophies", unit: "trophies" },
];

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// Day 1 of the daily counter - arbitrary reference point, only used to
// print a Wordle-style "Game #N" badge. Same epoch as Target Chase.
const GAME_NUMBER_EPOCH = Date.UTC(2026, 7, 1);

export function dailyGameNumber(date = new Date()) {
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((today - GAME_NUMBER_EPOCH) / 86400000) + 1;
}

export function dailyCategory(date = new Date()) {
  const dateKey = date.toISOString().slice(0, 10);
  // Salted differently from Target Chase's daily hash so the two games'
  // "daily pick" don't move in lockstep just because they share a date.
  const h = hashString(`buildxi-${dateKey}`);
  return { ...CATEGORIES[h % CATEGORIES.length], dateKey, gameNumber: dailyGameNumber(date) };
}

export function randomCategory() {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}
