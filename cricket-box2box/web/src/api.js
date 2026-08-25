import { categoryById, searchPlayers as searchPlayersLocal, answerCount, checkGuess } from "./game/data";
import { pickGrid } from "./game/gridgen";
import { getDifficulty } from "./game/difficulty";

export async function fetchGrid(difficultyKey) {
  const { rows, cols } = pickGrid(getDifficulty(difficultyKey));
  return {
    rows: rows.map((id) => categoryById.get(id)),
    cols: cols.map((id) => categoryById.get(id)),
    counts: rows.map((r) => cols.map((c) => answerCount(r, c))),
  };
}

export async function searchPlayers(query, exclude) {
  return searchPlayersLocal(query, exclude, 8);
}

export async function submitGuess(rowId, colId, name) {
  return checkGuess(rowId, colId, name);
}
