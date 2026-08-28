import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
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

function BlockCard({ block, revealed }) {
  const style = revealed ? FRANCHISE_STYLE[block.team] : null;
  return (
    <li className={`career-block${revealed ? " revealed" : " hidden"}`} style={style ? { background: style.bg, color: style.fg } : undefined}>
      {revealed ? (
        <>
          {style?.logo && <img src={style.logo} alt="" className="career-block-logo" />}
          <span className="career-block-team">{block.team}</span>
          <span className="career-block-seasons">
            {block.seasons[0]}
            {block.seasons.length > 1 ? `–${block.seasons[block.seasons.length - 1]}` : ""}
          </span>
        </>
      ) : (
        <span className="career-block-mystery">?</span>
      )}
    </li>
  );
}

export default function CareerPath() {
  const [mode, setMode] = useState("daily");
  const [game, setGame] = useState(() => newGameState(dailyPuzzle().player));
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    document.title = "Career Path — Cross Bat";
  }, []);

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

  const shareText = useMemo(() => {
    if (game.status === "playing") return null;
    const score = game.status === "won" ? game.guesses.length : "X";
    const squares = Array.from({ length: maxAttempts }, (_, i) => {
      if (i < game.guesses.length - 1) return "🟨";
      if (i === game.guesses.length - 1) return game.status === "won" ? "🟩" : "🟥";
      return "⬜";
    }).join("");
    const label = mode === "daily" ? `Daily ${dailyPuzzle().dateKey}` : "Practice";
    return `🏏 Cross Bat Career Path — ${label}\n${score}/${maxAttempts}\n${squares}`;
  }, [game, mode, maxAttempts]);

  const [copied, setCopied] = useState(false);
  function copyShare() {
    if (!shareText) return;
    navigator.clipboard?.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
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

      <ul className="career-blocks">
        {game.player.blocks.map((b, i) => (
          <BlockCard key={b.team} block={b} revealed={i < game.revealCount} />
        ))}
      </ul>

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
        <div className="career-result">
          <h2>{game.status === "won" ? "Got it!" : "Out of guesses"}</h2>
          <p>
            The answer was <strong>{game.player.name}</strong>.
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

      <p className="footnote">
        Team history built from every IPL match ever played (2008–2026). Only players with enough IPL
        history to be a fair puzzle are included.
      </p>
    </div>
  );
}
