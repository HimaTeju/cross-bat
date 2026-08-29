import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import { FRANCHISE_STYLE } from "../teamStyles";
import {
  players,
  SLOTS,
  SQUAD_SIZE,
  CATEGORIES,
  calibration,
  dailyCategory,
  randomCategory,
} from "./data";

const ROLE_ORDER = ["wicketkeeper", "batter", "allrounder", "bowler"];
const ROLE_LABELS = {
  wicketkeeper: "Wicketkeeper",
  batter: "Batters",
  allrounder: "All-rounders",
  bowler: "Bowlers",
};

function remainingNeededElsewhere(counts, excludeRole) {
  return ROLE_ORDER.reduce((sum, role) => {
    if (role === excludeRole) return sum;
    return sum + Math.max(0, SLOTS[role].min - (counts[role] || 0));
  }, 0);
}

export default function BuildXI() {
  const [mode, setMode] = useState("daily");
  const [phase, setPhase] = useState("spin"); // "spin" | "building" | "done"
  const [category, setCategory] = useState(() => dailyCategory());
  const [spinning, setSpinning] = useState(false);
  const [spinLabel, setSpinLabel] = useState(null);
  const [squad, setSquad] = useState([]);
  const [activeRole, setActiveRole] = useState("wicketkeeper");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "Build Your XI — Cross Bat";
  }, []);

  function newGame(nextMode) {
    setMode(nextMode);
    setCategory(nextMode === "daily" ? dailyCategory() : randomCategory());
    setSquad([]);
    setPhase("spin");
    setSpinLabel(null);
    setActiveRole("wicketkeeper");
    setQuery("");
    setCopied(false);
  }

  function spin() {
    if (spinning) return;
    setSpinning(true);
    const target = mode === "daily" ? dailyCategory() : randomCategory();
    let ticks = 0;
    const totalTicks = 16;
    let delay = 60;
    const tick = () => {
      setSpinLabel(CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].label);
      ticks++;
      delay += 14; // decelerate toward a stop
      if (ticks < totalTicks) {
        setTimeout(tick, delay);
      } else {
        setCategory(target);
        setSpinLabel(target.label);
        setSpinning(false);
        setTimeout(() => setPhase("building"), 500);
      }
    };
    tick();
  }

  const counts = useMemo(() => {
    const c = {};
    for (const role of ROLE_ORDER) c[role] = squad.filter((p) => p.role === role).length;
    return c;
  }, [squad]);

  const totalPicked = squad.length;

  function canAddToRole(role) {
    if (totalPicked >= SQUAD_SIZE) return false;
    if ((counts[role] || 0) >= SLOTS[role].max) return false;
    const neededElsewhere = remainingNeededElsewhere(counts, role);
    const slotsLeftAfterPick = SQUAD_SIZE - (totalPicked + 1);
    return slotsLeftAfterPick >= neededElsewhere;
  }

  function addPlayer(p) {
    if (phase !== "building") return;
    if (squad.some((s) => s.name === p.name)) return;
    if (!canAddToRole(p.role)) return;
    const next = [...squad, p];
    setSquad(next);
    if (next.length >= SQUAD_SIZE) {
      setPhase("done");
    }
  }

  function removePlayer(name) {
    if (phase !== "building") return;
    setSquad((s) => s.filter((p) => p.name !== name));
  }

  const pickedNames = useMemo(() => new Set(squad.map((p) => p.name)), [squad]);

  const pool = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players
      .filter((p) => p.role === activeRole)
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeRole, query]);

  const total = useMemo(() => squad.reduce((t, p) => t + p[category.key], 0), [squad, category]);

  const gameLabel = mode === "daily" ? `GAME #${category.gameNumber ?? ""}` : "PRACTICE";

  const shareText = useMemo(() => {
    if (phase !== "done") return null;
    const label = mode === "daily" ? `Daily ${category.dateKey}` : "Practice";
    return `🏏 Cross Bat Build Your XI — ${label}\nCategory: ${category.label}\nTotal: ${total.toLocaleString()} ${category.unit}`;
  }, [phase, mode, category, total]);

  function copyShare() {
    if (!shareText) return;
    navigator.clipboard?.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="pitch buildxi-page">
      <header className="masthead">
        <div className="brand">
          <Link to="/" className="corner" aria-label="Back to Cross Bat">
            <BrandMark className="corner-icon brand-mark" />
          </Link>
          <div className="brand-text">
            <h1>
              BUILD YOUR <span className="accent">XI</span>
            </h1>
            <p className="tagline">Spin for a stat category, then draft a role-balanced XI to maximize it.</p>
          </div>
        </div>
      </header>

      <div className="career-modes">
        <button className={mode === "daily" ? "btn-primary" : "btn-ghost"} onClick={() => newGame("daily")}>
          Daily
        </button>
        <button className={mode === "practice" ? "btn-primary" : "btn-ghost"} onClick={() => newGame("practice")}>
          Practice
        </button>
      </div>

      <div className="buildxi-game-label">{gameLabel}</div>

      {phase === "spin" && (
        <div className="buildxi-spin">
          <div className={`buildxi-reel${spinning ? " spinning" : ""}`}>{spinLabel || "SPIN TO REVEAL"}</div>
          <button className="btn-primary" onClick={spin} disabled={spinning}>
            {spinning ? "Spinning…" : "SPIN"}
          </button>
        </div>
      )}

      {phase !== "spin" && (
        <>
          <div className="buildxi-category">
            <span className="buildxi-category-label">Category</span>
            <span className="buildxi-category-value">{category.label}</span>
          </div>

          {phase === "building" && (
            <>
              <div className="buildxi-roles">
                {ROLE_ORDER.map((role) => (
                  <button
                    key={role}
                    className={`buildxi-role-tab${activeRole === role ? " active" : ""}`}
                    onClick={() => setActiveRole(role)}
                  >
                    {ROLE_LABELS[role]}
                    <span className="buildxi-role-count">
                      {counts[role] || 0}/{SLOTS[role].max}
                    </span>
                  </button>
                ))}
              </div>

              <div className="buildxi-progress">{totalPicked}/{SQUAD_SIZE} picked</div>

              <ul className="buildxi-squad">
                {squad.map((p) => {
                  const style = FRANCHISE_STYLE[p.team];
                  return (
                    <li
                      key={p.name}
                      className="buildxi-chip"
                      style={style ? { background: style.bg, color: style.fg } : undefined}
                    >
                      {style?.logo && <img src={style.logo} alt="" className="buildxi-chip-logo" />}
                      <span>{p.name}</span>
                      <button
                        className="buildxi-chip-remove"
                        onClick={() => removePlayer(p.name)}
                        aria-label={`Remove ${p.name}`}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>

              {squad.length > 0 && (
                <div className="target-reset">
                  <button className="btn-ghost" onClick={() => setSquad([])}>
                    Reset squad
                  </button>
                </div>
              )}

              <div className="target-pool-controls">
                <input
                  type="text"
                  placeholder={`Search ${ROLE_LABELS[activeRole].toLowerCase()}…`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <ul className="target-pool">
                {pool.map((p) => {
                  const picked = pickedNames.has(p.name);
                  const style = FRANCHISE_STYLE[p.team];
                  const addable = !picked && canAddToRole(p.role);
                  return (
                    <li key={p.name} className={`target-pool-item${picked ? " picked" : ""}`}>
                      {style?.logo && <img src={style.logo} alt="" className="target-pool-logo" />}
                      <span className="target-pool-name">{p.name}</span>
                      <button className="btn-ghost" disabled={!addable} onClick={() => addPlayer(p)}>
                        {picked ? "Added" : "Add"}
                      </button>
                    </li>
                  );
                })}
                {pool.length === 0 && <li className="target-pool-empty">No players match.</li>}
              </ul>
            </>
          )}

          {phase === "done" && (
            <div className="career-result">
              <h2>XI complete!</h2>
              <p>
                Your XI's {category.label} total: <strong>{total.toLocaleString()} {category.unit}</strong>
              </p>
              <p className="buildxi-benchmark">
                Best possible under these role rules: {calibration.bestPossible[category.key].toLocaleString()}{" "}
                {category.unit}
              </p>
              <pre className="career-share">{shareText}</pre>
              <div className="career-result-actions">
                <button className="btn-primary" onClick={copyShare}>
                  {copied ? "Copied!" : "Copy result"}
                </button>
                <button className="btn-ghost" onClick={() => newGame("practice")}>
                  Play another
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <p className="footnote">
        Roles are inferred from real career batting/bowling rates, not hand-tagged — a handful of edge cases are
        possible. Runs, wickets, caps and trophies are real IPL career totals (2008–2026).
      </p>
    </div>
  );
}
