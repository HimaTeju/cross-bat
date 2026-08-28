import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import Confetti from "../components/Confetti";
import { playWinFanfare } from "../sound";
import { FRANCHISE_STYLE } from "../teamStyles";
import { searchCareerPlayers, dailyPuzzle, randomPuzzle } from "./data";

const MAX_ATTEMPTS = 6;

function attemptsFor(player) {
  return Math.min(MAX_ATTEMPTS, player.blocks.length);
}

function newGameState(player) {
  return {
    player,
    revealCount: 1,
    guesses: [],
    status: "playing", // "playing" | "won" | "lost"
  };
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("");
}

function CrestChip({ block, revealed }) {
  const style = revealed ? FRANCHISE_STYLE[block.team] : null;
  return (
    <div className={`crest-chip${revealed ? " revealed" : " hidden"}`} title={revealed ? block.team : undefined}>
      <div className="crest-badge" style={revealed && style ? { borderColor: style.bg } : undefined}>
        {revealed ? (
          style?.logo ? (
            <img src={style.logo} alt={block.team} className="crest-logo" />
          ) : (
            <span className="crest-initials">{initials(block.team)}</span>
          )
        ) : (
          <span className="crest-mystery">?</span>
        )}
      </div>
      <div className="crest-caption">
        {revealed ? (
          <>
            <span className="crest-team">{initials(block.team)}</span>
            <span className="crest-seasons">
              {block.seasons[0]}
              {block.seasons.length > 1 ? `–${block.seasons[block.seasons.length - 1]}` : ""}
            </span>
          </>
        ) : (
          <span className="crest-team dim">?</span>
        )}
      </div>
    </div>
  );
}

export default function CareerPath() {
  const [mode, setMode] = useState("daily");
  const [game, setGame] = useState(() => newGameState(dailyPuzzle().player));
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [celebrating, setCelebrating] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    document.title = "Career Path — Cross Bat";
  }, []);

  useEffect(() => {
    if (game.status !== "won") return;
    setCelebrating(true);
    playWinFanfare();
    const t = setTimeout(() => setCelebrating(false), 3200);
    return () => clearTimeout(t);
  }, [game.status]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setSuggestions(searchCareerPlayers(q, game.guesses.map((g) => g.name)));
  }, [query, game.guesses]);

  const maxAttempts = attemptsFor(game.player);

  function startDaily() {
    setMode("daily");
    setGame(newGameState(dailyPuzzle().player));
    setQuery("");
  }

  function startPractice() {
    setMode("practice");
    setGame(newGameState(randomPuzzle(game.player.name)));
    setQuery("");
  }

  function guess(name) {
    setQuery("");
    setSuggestions([]);
    inputRef.current?.focus();
    setGame((g) => {
      if (g.status !== "playing") return g;
      const correct = name === g.player.name;
      const guesses = [...g.guesses, { name, correct }];
      if (correct) {
        return { ...g, guesses, status: "won" };
      }
      const nextReveal = g.revealCount + 1;
      if (guesses.length >= maxAttempts) {
        return { ...g, guesses, revealCount: g.player.blocks.length, status: "lost" };
      }
      return { ...g, guesses, revealCount: Math.min(nextReveal, g.player.blocks.length) };
    });
  }

  return (
    <div className="pitch career-page">
      <header className="masthead">
        <div className="brand">
          <Link to="/" className="corner" aria-label="Back to Cross Bat">
            <BrandMark className="corner-icon brand-mark" />
          </Link>
          <div className="brand-text">
            <h1>
              CAREER <span className="accent">PATH</span>
            </h1>
            <p className="tagline">Guess the player from their IPL team history — oldest team first.</p>
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

      <div className="career-chain">
        {game.player.blocks.map((b, i) => (
          <Fragment key={i}>
            <CrestChip block={b} revealed={i < game.revealCount} />
            <span className="career-arrow" aria-hidden="true">
              →
            </span>
          </Fragment>
        ))}
        <div className="crest-chip mystery-player">
          <div className="crest-badge mystery-badge">
            <span className="crest-mystery">?</span>
          </div>
          <div className="crest-caption">
            <span className="crest-team">{game.status === "playing" ? "???" : game.player.name}</span>
          </div>
        </div>
      </div>

      {game.guesses.length > 0 && (
        <ul className="career-guesses">
          {game.guesses.map((g, i) => (
            <li key={i} className={g.correct ? "correct" : "wrong"}>
              {g.name}
            </li>
          ))}
        </ul>
      )}

      {game.status === "playing" ? (
        <div className="career-guess-box">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a cricketer's name…"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p className="career-attempts">
            {game.guesses.length} / {maxAttempts} guesses used
          </p>
          {suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((name) => (
                <li key={name} onClick={() => guess(name)}>
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className={`career-result ${game.status}`}>
          <span className="career-result-icon" aria-hidden="true">
            {game.status === "won" ? "🏆" : "🏏"}
          </span>
          <h2>{game.status === "won" ? "Six! Got it." : "Stumped!"}</h2>
          <p>
            {game.status === "won" ? (
              <>
                You spotted <strong>{game.player.name}</strong> in {game.guesses.length}{" "}
                {game.guesses.length === 1 ? "guess" : "guesses"}.
              </>
            ) : (
              <>
                The answer was <strong>{game.player.name}</strong>.
              </>
            )}
          </p>
          <div className="career-result-actions">
            <button className="btn-primary" onClick={startPractice}>
              Play another
            </button>
          </div>
        </div>
      )}

      <p className="footnote">
        Team history built from every IPL match ever played (2008–2026). Only players with enough IPL
        history to be a fair puzzle are included.
      </p>

      {celebrating && <Confetti />}
    </div>
  );
}
