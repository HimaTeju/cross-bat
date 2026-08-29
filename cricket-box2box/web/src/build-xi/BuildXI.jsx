import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import ConfirmDialog from "../components/ConfirmDialog";
import { FRANCHISE_STYLE } from "../teamStyles";
import { players, SLOTS, SQUAD_SIZE, CATEGORIES, calibration, randomCategory } from "./data";

const ROLE_ORDER = ["wicketkeeper", "batter", "allrounder", "bowler"];
const ROLE_LABELS = {
  wicketkeeper: "Wicketkeepers",
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
  const [phase, setPhase] = useState("spin"); // "spin" | "building" | "done"
  const [category, setCategory] = useState(() => randomCategory());
  const [spinning, setSpinning] = useState(false);
  const [spinLabel, setSpinLabel] = useState(null);
  const [squad, setSquad] = useState([]);
  const [query, setQuery] = useState("");
  const [confirmNew, setConfirmNew] = useState(false);

  useEffect(() => {
    document.title = "Build Your XI — Cross Bat";
  }, []);

  function startNewGame() {
    setCategory(randomCategory());
    setSquad([]);
    setPhase("spin");
    setSpinLabel(null);
    setQuery("");
  }

  function requestNewGame() {
    if (phase === "building" && squad.length > 0) {
      setConfirmNew(true);
    } else {
      startNewGame();
    }
  }

  function spin() {
    if (spinning) return;
    setSpinning(true);
    const target = randomCategory();
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

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return players
      .filter((p) => !pickedNames.has(p.name))
      .filter((p) => p.name.toLowerCase().includes(q))
      .filter((p) => canAddToRole(p.role))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [query, pickedNames, squad]);

  function pickSuggestion(p) {
    addPlayer(p);
    setQuery("");
  }

  const total = useMemo(() => squad.reduce((t, p) => t + p[category.key], 0), [squad, category]);

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

          <div className="buildxi-progress">{totalPicked}/{SQUAD_SIZE} picked</div>

          <div className="buildxi-field">
            {ROLE_ORDER.map((role) => (
              <div className="buildxi-row" key={role}>
                <div className="buildxi-row-header">
                  <span>{ROLE_LABELS[role]}</span>
                  <span className="buildxi-row-count">
                    {counts[role] || 0}/{SLOTS[role].max}
                  </span>
                </div>
                <div className="buildxi-row-players">
                  {squad
                    .filter((p) => p.role === role)
                    .map((p) => {
                      const style = FRANCHISE_STYLE[p.team];
                      return (
                        <div
                          key={p.name}
                          className="buildxi-slot filled"
                          style={style ? { background: style.bg, color: style.fg } : undefined}
                        >
                          <span className="buildxi-slot-name">{p.name}</span>
                          {phase === "building" && (
                            <button
                              className="buildxi-slot-remove"
                              onClick={() => removePlayer(p.name)}
                              aria-label={`Remove ${p.name}`}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  {phase === "building" &&
                    Array.from({ length: Math.max(0, SLOTS[role].min - (counts[role] || 0)) }).map((_, i) => (
                      <div key={`empty-${role}-${i}`} className="buildxi-slot empty">
                        +
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {phase === "building" && (
            <>
              {squad.length > 0 && (
                <div className="target-reset">
                  <button className="btn-ghost" onClick={() => setSquad([])}>
                    Reset squad
                  </button>
                </div>
              )}

              <div className="buildxi-search-box">
                <input
                  type="text"
                  placeholder="Search a player to add…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {suggestions.length > 0 && (
                  <ul className="suggestions">
                    {suggestions.map((p) => (
                      <li key={p.name} onClick={() => pickSuggestion(p)}>
                        {p.name}
                        <span className="buildxi-suggestion-role">{ROLE_LABELS[p.role]}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {query.trim().length >= 2 && suggestions.length === 0 && (
                  <p className="buildxi-search-empty">No players match.</p>
                )}
              </div>
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
              <div className="career-result-actions">
                <button className="btn-primary" onClick={startNewGame}>
                  Play Again
                </button>
                <Link className="btn-ghost" to="/">
                  Other Games
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      <div className="controls">
        <button className="btn-primary" onClick={requestNewGame}>
          New XI
        </button>
      </div>

      <p className="footnote">
        Roles are inferred from real career batting/bowling rates, not hand-tagged — a handful of edge cases are
        possible. Runs, wickets, caps and trophies are real IPL career totals (2008–2026).
      </p>

      {confirmNew && (
        <ConfirmDialog
          title="Start a new XI?"
          message="This clears your current squad and picks. Are you sure?"
          confirmLabel="New XI"
          cancelLabel="Keep Playing"
          onConfirm={() => {
            setConfirmNew(false);
            startNewGame();
          }}
          onCancel={() => setConfirmNew(false)}
        />
      )}
    </div>
  );
}
