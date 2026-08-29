import dataRaw from "../../../server/data/target-chase.json";

// [{ name, runs, wickets, matches }]
export const players = dataRaw.players;
export const calibration = dataRaw.calibration;
export const SQUAD_SIZE = calibration.squadSize || 5;

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function roundTo(n, step) {
  return Math.round(n / step) * step;
}

// Targets are a fraction of what's achievable picking SQUAD_SIZE pure
// specialists from this pool (see calibration.maxRuns/maxWickets) - keeps
// every generated target reachable, but never by simply drafting all
// batters or all bowlers.
const RUNS_FRAC_MIN = 0.28;
const RUNS_FRAC_RANGE = 0.22;
const WICKETS_FRAC_MIN = 0.32;
const WICKETS_FRAC_RANGE = 0.28;

// Day 1 of the daily counter - arbitrary reference point, only used to
// print a Wordle-style "Game #N" badge.
const GAME_NUMBER_EPOCH = Date.UTC(2026, 7, 1);

export function dailyGameNumber(date = new Date()) {
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((today - GAME_NUMBER_EPOCH) / 86400000) + 1;
}

export function dailyTarget(date = new Date()) {
  const dateKey = date.toISOString().slice(0, 10);
  const h = hashString(dateKey);
  const runsFrac = RUNS_FRAC_MIN + ((h % 1000) / 1000) * RUNS_FRAC_RANGE;
  const wicketsFrac = WICKETS_FRAC_MIN + (((h >>> 10) % 1000) / 1000) * WICKETS_FRAC_RANGE;
  return {
    dateKey,
    gameNumber: dailyGameNumber(date),
    runs: roundTo(calibration.maxRuns * runsFrac, 500),
    wickets: roundTo(calibration.maxWickets * wicketsFrac, 25),
  };
}

export function randomTarget() {
  const runsFrac = RUNS_FRAC_MIN + Math.random() * RUNS_FRAC_RANGE;
  const wicketsFrac = WICKETS_FRAC_MIN + Math.random() * WICKETS_FRAC_RANGE;
  return {
    runs: roundTo(calibration.maxRuns * runsFrac, 500),
    wickets: roundTo(calibration.maxWickets * wicketsFrac, 25),
  };
}
