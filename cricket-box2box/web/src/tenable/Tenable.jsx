import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import ConfirmDialog from "../components/ConfirmDialog";
import Confetti from "../components/Confetti";
import { playWinFanfare } from "../sound";
import { categories, searchPlayers, LIVES } from "./data";

const PYRAMID_RANKS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function Tenable() {
  const [phase, setPhase] = useState("picking"); // "picking" | "playing" | "done"
  const [category, setCategory] = useState(null);
  const [found, setFound] = useState({}); // rank -> name
  const [wrongNames, setWrongNames] = useState([]);
  const [wicketsDown, setWicketsDown] = useState(0);
  const [query, setQuery] = useState("");
  const [shake, setShake] = useState(false);
  const [confirmNewCategory, setConfirmNewCategory] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [outcome, setOutcome] = useState(null); // "win" | "allout"
  const [howToPlay, setHowToPlay] = useState(false);

  useEffect(() => {
    document.title = "Cricket Tenable — Cross Bat";
  }, []);

  function startCategory(c) {
    setCategory(c);
    setFound({});
    setWrongNames([]);
    setWicketsDown(0);
    setQuery("");
    setOutcome(null);
    setCelebrating(false);
    setPhase("playing");
  }

  function backToPicker() {
    setPhase("picking");
    setCategory(null);
  }

  function requestBackToPicker() {
    if (phase === "playing" && Object.keys(found).length > 0) {
      setConfirmNewCategory(true);
    } else {
      backToPicker();
    }
  }

  const foundNames = useMemo(() => Object.values(found), [found]);
  const excludedNames = useMemo(() => [...foundNames, ...wrongNames], [foundNames, wrongNames]);

  const suggestions = useMemo(() => {
    if (phase !== "playing") return [];
    return searchPlayers(query, excludedNames);
  }, [query, excludedNames, phase]);

  const answersByName = useMemo(() => {
    if (!category) return new Map();
    return new Map(category.answers.map((a) => [a.name, a]));
  }, [category]);

  function guess(name) {
    const answer = answersByName.get(name);
    if (answer && found[answer.rank] === undefined) {
      setFound((prev) => ({ ...prev, [answer.rank]: answer.name }));
    } else if (!answer) {
      setWrongNames((prev) => [...prev, name]);
      setWicketsDown((prev) => prev + 1);
      setShake(true);
      setTimeout(() => setShake(false), 420);
    }
    setQuery("");
  }

  const foundCount = Object.keys(found).length;
  const livesLeft = LIVES - wicketsDown;

  useEffect(() => {
    if (phase !== "playing") return;
    if (foundCount === 10) {
      setOutcome("win");
      setPhase("done");
      setCelebrating(true);
      playWinFanfare();
      const t = setTimeout(() => setCelebrating(false), 3200);
      return () => clearTimeout(t);
    }
    if (livesLeft <= 0) {
      setOutcome("allout");
      setPhase("done");
    }
  }, [foundCount, livesLeft, phase]);

  const revealMisses = phase === "done";

  return (
    <div className="pitch tenable-page">
      <header className="masthead">
        <div className="brand">
          <Link to="/" className="corner" aria-label="Back to Cross Bat">
            <BrandMark className="corner-icon brand-mark" />
          </Link>
          <div className="brand-text">
            <h1>
              CRICKET <span className="accent">TENABLE</span>
            </h1>
            <p className="tagline">Pick a category. Name the real top 10. Three wickets, that's your innings.</p>
          </div>
        </div>
      </header>

      {phase === "picking" && (
        <>
          <p className="tenable-picking-prompt">Choose a category</p>
          <div className="tenable-category-grid">
            {categories.map((c) => (
              <button key={c.id} type="button" className="tenable-category-card" onClick={() => startCategory(c)}>
                <h2>{c.label}</h2>
                <p>{c.description}</p>
                {c.tieCaveat && <span className="tenable-tie-caveat">Several spots are tied — order isn't strict.</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {phase !== "picking" && category && (
        <>
          <div className="tenable-category-header">
            <span className="tenable-category-label">Category</span>
            <span className="tenable-category-value">{category.label}</span>
          </div>

          <div className="tenable-scoreboard">
            <div className="tenable-progress">{foundCount}/10 found</div>
            <div className="tenable-wickets" role="status" aria-live="polite">
              <span className="tenable-wickets-label">Wickets in hand</span>
              <div className="tenable-stumps">
                {Array.from({ length: LIVES }).map((_, i) => (
                  <span key={i} className={`tenable-stump${i < livesLeft ? "" : " fallen"}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="tenable-pyramid">
            {PYRAMID_RANKS.map((rank) => {
              const answer = category.answers.find((a) => a.rank === rank);
              const revealedName = found[rank];
              const missed = revealMisses && !revealedName && answer;
              return (
                <div
                  key={rank}
                  className={`tenable-slot${revealedName ? " filled" : ""}${missed ? " missed" : ""}`}
                  style={{ width: `${28 + (rank - 1) * 7.2}%` }}
                >
                  <span className="tenable-slot-rank">{rank}</span>
                  <span className="tenable-slot-name">
                    {revealedName || (missed ? answer.name : "?")}
                  </span>
                  {(revealedName || missed) && (
                    <span className="tenable-slot-value">
                      {answer.value.toLocaleString()} {category.unit}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {phase === "playing" && (
            <div className={`tenable-search-box${shake ? " shake" : ""}`}>
              <input
                type="text"
                placeholder="Guess a player…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && suggestions.length === 1) guess(suggestions[0]);
                }}
              />
              {suggestions.length > 0 && (
                <ul className="suggestions">
                  {suggestions.map((name) => (
                    <li key={name} onClick={() => guess(name)}>
                      {name}
                    </li>
                  ))}
                </ul>
              )}
              {query.trim().length >= 2 && suggestions.length === 0 && (
                <p className="tenable-search-empty">No players match.</p>
              )}
            </div>
          )}

          {phase === "done" && (
            <div className="tenable-result">
              <h2>{outcome === "win" ? "🏆 Perfect 10!" : "All out"}</h2>
              <p>
                {outcome === "win"
                  ? `You named the entire real top 10 for ${category.label} with ${livesLeft} wicket${livesLeft === 1 ? "" : "s"} to spare.`
                  : `You found ${foundCount}/10 before running out of wickets. The rest are revealed above.`}
              </p>
              <div className="career-result-actions">
                <button className="btn-primary" onClick={() => startCategory(category)}>
                  Same Category Again
                </button>
                <button className="btn-ghost" onClick={requestBackToPicker}>
                  New Category
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="controls">
        {phase === "playing" && (
          <button className="btn-ghost" onClick={requestBackToPicker}>
            New Category
          </button>
        )}
        <button className="btn-ghost" onClick={() => setHowToPlay(true)}>
          How to play
        </button>
      </div>

      <p className="footnote">
        Real IPL career leaderboards (2008–2026), from the same match data every Cross Bat game
        uses. A handful of Orange/Purple Cap ranks are tied among one-time winners — see each
        category's note.
      </p>

      {confirmNewCategory && (
        <ConfirmDialog
          title="Abandon this pyramid?"
          message="You'll lose your current progress on this category. Are you sure?"
          confirmLabel="Yes, switch"
          cancelLabel="Keep Playing"
          onConfirm={() => {
            setConfirmNewCategory(false);
            backToPicker();
          }}
          onCancel={() => setConfirmNewCategory(false)}
        />
      )}

      {howToPlay && (
        <div className="toast" onClick={(e) => e.target === e.currentTarget && setHowToPlay(false)}>
          <div className="toast-box" role="dialog" aria-modal="true" aria-label="How to play Cricket Tenable">
            <h2>How to play</h2>
            <ul className="rules">
              <li>Pick a category — a real IPL career leaderboard, like <em>Most Runs</em> or <em>Most Wickets</em>.</li>
              <li>Guess players. A correct guess lights up in its true rank slot on the pyramid, 1 (top) to 10 (base).</li>
              <li>A wrong guess costs a wicket. Lose all 3 and your innings ends — whatever's left gets revealed.</li>
              <li>Find all 10 before running out of wickets to score a Perfect 10.</li>
            </ul>
            <div className="confirm-actions">
              <button className="btn-primary" onClick={() => setHowToPlay(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {celebrating && <Confetti />}
    </div>
  );
}
