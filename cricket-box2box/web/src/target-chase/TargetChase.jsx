import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import { FRANCHISE_STYLE } from "../teamStyles";
import { players, SQUAD_SIZE, dailyTarget, randomTarget, dailyGameNumber } from "./data";

function sum(arr, key) {
  return arr.reduce((total, p) => total + p[key], 0);
}

// Purely decorative arrangement around the ground - not real fielding
// positions, just a pleasant scatter for up to 5 slots.
const SLOT_POSITIONS = [
  { x: 50, y: 12 },
  { x: 84, y: 38 },
  { x: 69, y: 82 },
  { x: 31, y: 82 },
  { x: 16, y: 38 },
];

function Ground({ squad, squadSize, status, gameLabel, onRemove }) {
  return (
    <div className="target-ground">
      <svg className="target-ground-svg" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
        <ellipse cx="200" cy="150" rx="196" ry="146" className="ground-boundary" />
        <ellipse cx="200" cy="150" rx="122" ry="90" className="ground-circle" />
        <rect x="177" y="96" width="46" height="108" rx="3" className="ground-strip" />
        <line x1="177" y1="120" x2="223" y2="120" className="ground-crease" />
        <line x1="177" y1="180" x2="223" y2="180" className="ground-crease" />
      </svg>

      {Array.from({ length: squadSize }, (_, i) => squad[i]).map((p, i) => {
        const pos = SLOT_POSITIONS[i % SLOT_POSITIONS.length];
        const style = p ? FRANCHISE_STYLE[p.team] : null;
        return (
          <div key={i} className="target-slot" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
            {p ? (
              <div
                className="target-slot-chip"
                style={style ? { background: style.bg, color: style.fg } : undefined}
              >
                {status === "playing" && (
                  <button className="target-slot-remove" onClick={() => onRemove(p.name)} aria-label={`Remove ${p.name}`}>
                    ×
                  </button>
                )}
                {style?.logo && <img src={style.logo} alt="" className="target-slot-logo" />}
                <span className="target-slot-name">{p.name}</span>
                <span className="target-slot-stats">
                  {p.runs.toLocaleString()}R · {p.wickets}W
                </span>
              </div>
            ) : (
              <div className="target-slot-empty">+</div>
            )}
          </div>
        );
      })}

      <div className="target-ground-badge">
        <span>{gameLabel}</span>
        <span>{squadSize} PICKS</span>
      </div>
    </div>
  );
}

export default function TargetChase() {
  const [mode, setMode] = useState("daily");
  const [target, setTarget] = useState(() => dailyTarget());
  const [squad, setSquad] = useState([]);
  const [status, setStatus] = useState("playing"); // "playing" | "won" | "lost"
  const [sortBy, setSortBy] = useState("runs"); // "runs" | "wickets" | "name"
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "Target Chase — Cross Bat";
  }, []);

  const runsSum = useMemo(() => sum(squad, "runs"), [squad]);
  const wicketsSum = useMemo(() => sum(squad, "wickets"), [squad]);
  const runsMet = runsSum >= target.runs;
  const wicketsMet = wicketsSum >= target.wickets;

  function startDaily() {
    setMode("daily");
    setTarget(dailyTarget());
    setSquad([]);
    setStatus("playing");
    setCopied(false);
  }

  function startPractice() {
    setMode("practice");
    setTarget(randomTarget());
    setSquad([]);
    setStatus("playing");
    setCopied(false);
  }

  function addPlayer(p) {
    if (status !== "playing" || squad.length >= SQUAD_SIZE) return;
    if (squad.some((s) => s.name === p.name)) return;
    const next = [...squad, p];
    setSquad(next);
    const nextRuns = sum(next, "runs");
    const nextWickets = sum(next, "wickets");
    if (nextRuns >= target.runs && nextWickets >= target.wickets) {
      setStatus("won");
    } else if (next.length >= SQUAD_SIZE) {
      setStatus("lost");
    }
  }

  function removePlayer(name) {
    if (status !== "playing") return;
    setSquad((s) => s.filter((p) => p.name !== name));
  }

  function resetSquad() {
    setSquad([]);
    setStatus("playing");
  }

  const pickedNames = useMemo(() => new Set(squad.map((p) => p.name)), [squad]);

  const gameLabel = mode === "daily" ? `GAME #${target.gameNumber ?? dailyGameNumber()}` : "PRACTICE";

  const pool = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? players.filter((p) => p.name.toLowerCase().includes(q)) : players.slice();
    list.sort((a, b) => (sortBy === "name" ? a.name.localeCompare(b.name) : b[sortBy] - a[sortBy]));
    return list;
  }, [query, sortBy]);

  const shareText = useMemo(() => {
    if (status === "playing") return null;
    const label = mode === "daily" ? `Daily ${target.dateKey}` : "Practice";
    const outcome =
      status === "won" ? `Cleared in ${squad.length}/${SQUAD_SIZE} picks!` : `Fell short after ${SQUAD_SIZE}/${SQUAD_SIZE} picks`;
    return `🏏 Cross Bat Target Chase — ${label}\n${target.runs.toLocaleString()} runs / ${target.wickets} wickets\n${
      status === "won" ? "✅" : "❌"
    } ${outcome}`;
  }, [status, mode, target, squad.length]);

  function copyShare() {
    if (!shareText) return;
    navigator.clipboard?.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="pitch target-page">
      <header className="masthead">
        <div className="brand">
          <Link to="/" className="corner" aria-label="Back to Cross Bat">
            <BrandMark className="corner-icon brand-mark" />
          </Link>
          <div className="brand-text">
            <h1>
              TARGET <span className="accent">CHASE</span>
            </h1>
            <p className="tagline">
              Draft a {SQUAD_SIZE}-player XI to clear both targets — real career IPL runs and wickets.
            </p>
          </div>
        </div>
      </header>

      <div className="career-modes">
        <button className={mode === "daily" ? "btn-primary" : "btn-ghost"} onClick={startDaily}>
          Daily
        </button>
        <button className={mode === "practice" ? "btn-primary" : "btn-ghost"} onClick={startPractice}>
          Practice
        </button>
      </div>

      <div className="target-goals">
        <div className={`target-goal${runsMet ? " met" : ""}`}>
          <span className="target-goal-label">Runs {runsMet && "✓"}</span>
          <span className="target-goal-value">
            {runsSum.toLocaleString()} / {target.runs.toLocaleString()}
          </span>
          <div className="target-bar">
            <div className="target-bar-fill" style={{ width: `${Math.min(100, (runsSum / target.runs) * 100)}%` }} />
          </div>
        </div>
        <div className={`target-goal${wicketsMet ? " met" : ""}`}>
          <span className="target-goal-label">Wickets {wicketsMet && "✓"}</span>
          <span className="target-goal-value">
            {wicketsSum} / {target.wickets}
          </span>
          <div className="target-bar">
            <div
              className="target-bar-fill"
              style={{ width: `${Math.min(100, (wicketsSum / target.wickets) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <Ground squad={squad} squadSize={SQUAD_SIZE} status={status} gameLabel={gameLabel} onRemove={removePlayer} />

      {status === "playing" ? (
        <>
          <div className="target-pool-controls">
            <input
              type="text"
              placeholder="Search players…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="target-sort">
              <button className={sortBy === "runs" ? "btn-primary" : "btn-ghost"} onClick={() => setSortBy("runs")}>
                Runs
              </button>
              <button className={sortBy === "wickets" ? "btn-primary" : "btn-ghost"} onClick={() => setSortBy("wickets")}>
                Wickets
              </button>
              <button className={sortBy === "name" ? "btn-primary" : "btn-ghost"} onClick={() => setSortBy("name")}>
                A–Z
              </button>
            </div>
          </div>
          <ul className="target-pool">
            {pool.map((p) => {
              const picked = pickedNames.has(p.name);
              const full = squad.length >= SQUAD_SIZE;
              const style = FRANCHISE_STYLE[p.team];
              return (
                <li key={p.name} className={`target-pool-item${picked ? " picked" : ""}`}>
                  {style?.logo && <img src={style.logo} alt="" className="target-pool-logo" />}
                  <span className="target-pool-name">{p.name}</span>
                  <span className="target-pool-stats">
                    {p.runs.toLocaleString()}R · {p.wickets}W
                  </span>
                  <button className="btn-ghost" disabled={picked || full} onClick={() => addPlayer(p)}>
                    {picked ? "Added" : "Add"}
                  </button>
                </li>
              );
            })}
            {pool.length === 0 && <li className="target-pool-empty">No players match.</li>}
          </ul>
        </>
      ) : (
        <div className="career-result">
          <h2>{status === "won" ? "Target cleared!" : "Fell short"}</h2>
          <p>
            {runsSum.toLocaleString()} runs, {wicketsSum} wickets from {squad.length} pick{squad.length === 1 ? "" : "s"}.
          </p>
          <pre className="career-share">{shareText}</pre>
          <div className="career-result-actions">
            <button className="btn-primary" onClick={copyShare}>
              {copied ? "Copied!" : "Copy result"}
            </button>
            <button className="btn-ghost" onClick={startPractice}>
              Play another
            </button>
          </div>
        </div>
      )}

      {status === "playing" && squad.length > 0 && (
        <div className="target-reset">
          <button className="btn-ghost" onClick={resetSquad}>
            Reset squad
          </button>
        </div>
      )}

      <p className="footnote">
        Runs and wickets are real career IPL totals (2008–2026), computed from ball-by-ball match data. Pool is the
        top scorers/wicket-takers only — more players coming.
      </p>
    </div>
  );
}
