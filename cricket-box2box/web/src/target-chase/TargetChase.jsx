import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import { players, SQUAD_SIZE, dailyTarget, randomTarget } from "./data";

function sum(arr, key) {
  return arr.reduce((total, p) => total + p[key], 0);
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

      <ul className="target-squad">
        {Array.from({ length: SQUAD_SIZE }, (_, i) => squad[i]).map((p, i) => (
          <li key={i} className={`target-slot${p ? " filled" : ""}`}>
            {p ? (
              <>
                <span className="target-slot-name">{p.name}</span>
                <span className="target-slot-stats">
                  {p.runs.toLocaleString()}R · {p.wickets}W
                </span>
                {status === "playing" && (
                  <button className="target-slot-remove" onClick={() => removePlayer(p.name)} aria-label={`Remove ${p.name}`}>
                    ×
                  </button>
                )}
              </>
            ) : (
              <span className="target-slot-empty">+</span>
            )}
          </li>
        ))}
      </ul>

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
              return (
                <li key={p.name} className={`target-pool-item${picked ? " picked" : ""}`}>
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
