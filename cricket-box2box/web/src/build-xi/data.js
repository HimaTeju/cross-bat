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

export function randomCategory() {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}
