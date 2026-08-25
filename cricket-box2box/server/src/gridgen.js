import { categories, adjacency } from "./data.js";

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function intersect(a, b) {
  const out = new Set();
  a.forEach((x) => {
    if (b.has(x)) out.add(x);
  });
  return out;
}

export function pickGrid() {
  const ids = categories.map((c) => c.id).filter((id) => adjacency.has(id));

  for (let attempt = 0; attempt < 400; attempt++) {
    const rowCandidates = shuffle(ids.slice()).slice(0, 8);
    for (const r0 of rowCandidates) {
      const rowSet = [r0];
      let common = new Set(adjacency.get(r0) || []);
      for (const r of shuffle(ids.slice())) {
        if (rowSet.includes(r) || !adjacency.has(r)) continue;
        const inter = intersect(common, adjacency.get(r));
        if (inter.size >= 3) {
          rowSet.push(r);
          common = inter;
          if (rowSet.length === 3) break;
        }
      }
      const colChoices = Array.from(common).filter((id) => !rowSet.includes(id));
      if (rowSet.length === 3 && colChoices.length >= 3) {
        const colSet = shuffle(colChoices).slice(0, 3);
        return { rows: rowSet, cols: colSet };
      }
    }
  }
  throw new Error("could not generate a valid grid from current data");
}
