import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Board from "./components/Board";
import SearchOverlay from "./components/SearchOverlay";
import HowToPlay from "./components/HowToPlay";
import ConfirmDialog from "./components/ConfirmDialog";
import WinModal from "./components/WinModal";
import Confetti from "./components/Confetti";
import { fetchGrid, submitGuess } from "./api";
import { playWinFanfare } from "./sound";

const EMPTY_CELLS = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

export default function App() {
  const [grid, setGrid] = useState(null); // { rows, cols }
  const [cellState, setCellState] = useState(EMPTY_CELLS);
  const [usedPlayers, setUsedPlayers] = useState([]);
  const [activeCell, setActiveCell] = useState(null); // {r, c}
  const [shakeMap, setShakeMap] = useState({});
  const [howToPlay, setHowToPlay] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmNewGrid, setConfirmNewGrid] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const celebratedRef = useRef(false);

  const loadGrid = useCallback(() => {
    setLoading(true);
    setError(null);
    celebratedRef.current = false;
    setShowWinModal(false);
    setCelebrating(false);
    fetchGrid()
      .then((g) => {
        setGrid(g);
        setCellState(EMPTY_CELLS.map((row) => row.slice()));
        setUsedPlayers([]);
        setShakeMap({});
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadGrid();
  }, [loadGrid]);

  useEffect(() => {
    document.title = "IPL Grid — Cross Bat";
  }, []);

  function openCell(r, c) {
    setActiveCell({ r, c });
  }

  async function handleGuess(name) {
    if (!activeCell || !grid) return { correct: false };
    const { r, c } = activeCell;
    const rowId = grid.rows[r].id;
    const colId = grid.cols[c].id;
    const result = await submitGuess(rowId, colId, name);

    if (result.correct) {
      setCellState((prev) => {
        const next = prev.map((row) => row.slice());
        next[r][c] = { name: result.name };
        return next;
      });
      setUsedPlayers((prev) => [...prev, result.name]);
      setActiveCell(null);
    } else {
      const key = `${r}-${c}`;
      setShakeMap((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    }
    return result;
  }

  const correctCount = cellState.flat().filter(Boolean).length;
  const complete = correctCount === 9;

  useEffect(() => {
    if (!complete || celebratedRef.current) return;
    celebratedRef.current = true;
    setShowWinModal(true);
    setCelebrating(true);
    playWinFanfare();
    const t = setTimeout(() => setCelebrating(false), 3200);
    return () => clearTimeout(t);
  }, [complete]);

  function requestNewGrid() {
    setConfirmNewGrid(true);
  }

  return (
    <div className="pitch">
      <header className="masthead">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            🏏
          </span>
          <div className="brand-text">
            <Link className="brand-home" to="/">
              ← Cross Bat
            </Link>
            <h1>
              IPL <span className="accent">GRID</span>
            </h1>
            <p className="tagline">Nine cells. Eighteen IPL seasons of squad memory. Zero repeats.</p>
          </div>
        </div>
        <div className="tally" role="status" aria-live="polite">
          <div className="tally-readout">
            <span>{correctCount}</span>
            <span className="tally-sep">/</span>
            <span>9</span>
          </div>
          <span className="tally-label">ON THE BOARD</span>
        </div>
      </header>

      <main className="board-wrap">
        {loading && <p className="loading">Setting the field…</p>}
        {error && <p className="error-banner">Couldn't reach the server: {error}</p>}
        {grid && !loading && (
          <Board
            rows={grid.rows}
            cols={grid.cols}
            cellState={cellState}
            counts={grid.counts}
            onOpenCell={openCell}
            shakeMap={shakeMap}
          />
        )}
      </main>

      {complete && <p className="win-banner">Full house! Every cell on the board.</p>}

      <div className="controls">
        <button className="btn-primary" onClick={requestNewGrid} disabled={loading}>
          New Grid
        </button>
        <button className="btn-ghost" onClick={() => setHowToPlay(true)}>
          How to play
        </button>
      </div>

      <p className="footnote">
        Squad history from every IPL match ever played (Cricsheet, 2008–2026), plus verified
        nationalities from Wikipedia squad pages and fact-checked legends. Found a mistake?{" "}
        <Link to="/ipl-grid/admin">Fix it in the data admin</Link>.
      </p>

      {activeCell && grid && (
        <SearchOverlay
          clue={`${grid.rows[activeCell.r].displayName} × ${grid.cols[activeCell.c].displayName}`}
          usedPlayers={usedPlayers}
          onGuess={handleGuess}
          onClose={() => setActiveCell(null)}
        />
      )}

      {howToPlay && <HowToPlay onClose={() => setHowToPlay(false)} />}

      {confirmNewGrid && (
        <ConfirmDialog
          title="Start a new grid?"
          message="This clears your current board and progress. Are you sure?"
          confirmLabel="New Grid"
          cancelLabel="Keep Playing"
          onConfirm={() => {
            setConfirmNewGrid(false);
            loadGrid();
          }}
          onCancel={() => setConfirmNewGrid(false)}
        />
      )}

      {showWinModal && (
        <WinModal onPlayAgain={loadGrid} onClose={() => setShowWinModal(false)} />
      )}

      {celebrating && <Confetti />}
    </div>
  );
}
