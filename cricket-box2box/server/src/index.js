import express from "express";
import cors from "cors";
import {
  categoryById,
  categories,
  gameData,
  searchPlayers,
  checkGuess,
  answerCount,
  AdminError,
  adminListPlayers,
  adminCreatePlayer,
  adminUpdatePlayer,
  adminDeletePlayer,
  adminListStagedAwards,
  adminApproveStagedAward,
  adminRejectStagedAward,
} from "./data.js";
import { pickGrid } from "./gridgen.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/gamedata", (req, res) => {
  res.json({
    lastUpdated: gameData.lastUpdated,
    categories,
  });
});

app.get("/api/grid", (req, res) => {
  try {
    const { rows, cols } = pickGrid();
    res.json({
      rows: rows.map((id) => categoryById.get(id)),
      cols: cols.map((id) => categoryById.get(id)),
      counts: rows.map((r) => cols.map((c) => answerCount(r, c))),
    });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

app.get("/api/players/search", (req, res) => {
  const q = String(req.query.q || "");
  const exclude = String(req.query.exclude || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  res.json({ results: searchPlayers(q, exclude, 8) });
});

app.post("/api/guess", (req, res) => {
  const { rowId, colId, name } = req.body || {};
  if (typeof rowId !== "number" || typeof colId !== "number" || typeof name !== "string") {
    return res.status(400).json({ error: "rowId, colId (numbers) and name (string) are required" });
  }
  res.json(checkGuess(rowId, colId, name));
});

// ---------- Admin ----------

app.get("/api/admin/categories", (req, res) => {
  res.json({ categories });
});

app.get("/api/admin/players", (req, res) => {
  res.json({ players: adminListPlayers() });
});

app.post("/api/admin/players", (req, res) => {
  const { name, categoryIds } = req.body || {};
  try {
    res.json(adminCreatePlayer(name, categoryIds || []));
  } catch (err) {
    if (err instanceof AdminError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

app.put("/api/admin/players/:name", (req, res) => {
  const { name, categoryIds } = req.body || {};
  try {
    res.json(adminUpdatePlayer(req.params.name, { name, categoryIds: categoryIds || [] }));
  } catch (err) {
    if (err instanceof AdminError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

app.delete("/api/admin/players/:name", (req, res) => {
  try {
    adminDeletePlayer(req.params.name);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

app.get("/api/admin/awards/staged", (req, res) => {
  res.json({ entries: adminListStagedAwards() });
});

app.post("/api/admin/awards/staged/:id/approve", (req, res) => {
  const id = Number(req.params.id);
  const { name } = req.body || {};
  try {
    res.json(adminApproveStagedAward(id, name));
  } catch (err) {
    if (err instanceof AdminError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

app.post("/api/admin/awards/staged/:id/reject", (req, res) => {
  const id = Number(req.params.id);
  try {
    res.json(adminRejectStagedAward(id));
  } catch (err) {
    if (err instanceof AdminError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Cross Bat Cricket API listening on http://localhost:${PORT}`);
});
