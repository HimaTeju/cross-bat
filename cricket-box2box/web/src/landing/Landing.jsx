import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DifficultyDialog from "../components/DifficultyDialog";
import BrandMark from "../components/BrandMark";

const GAMES = [
  {
    to: "/ipl-grid",
    title: "IPL Grid",
    blurb: "Fill a 3×3 grid connecting national teams and IPL franchises with a real player who played for both.",
    stats: "844 players · 15 franchises · 2008–2026",
    needsDifficulty: true,
  },
  {
    to: "/career-path",
    title: "Career Path",
    blurb: "Guess the player from their IPL team history, revealed one franchise at a time — oldest first.",
    stats: "50 players · a new puzzle every day",
    needsDifficulty: false,
  },
  {
    to: "/target-chase",
    title: "Target Chase",
    blurb: "Draft a 5-player XI whose combined career IPL runs and wickets clear both targets at once.",
    stats: "69 players · real career totals · 2008–2026",
    needsDifficulty: false,
  },
];

const COMING_SOON = [];

export default function Landing() {
  const navigate = useNavigate();
  const [pendingGame, setPendingGame] = useState(null);

  useEffect(() => {
    document.title = "Cross Bat — Cricket Games";
  }, []);

  return (
    <div className="pitch">
      <header className="masthead landing-masthead">
        <div className="brand">
          <BrandMark />
          <div className="brand-text">
            <h1>
              CROSS <span className="accent">BAT</span>
            </h1>
            <p className="tagline">Cricket games, all in one place.</p>
          </div>
        </div>
      </header>

      <main className="game-grid">
        {GAMES.map((g) => (
          <button
            key={g.to}
            type="button"
            className="game-card"
            onClick={() => (g.needsDifficulty ? setPendingGame(g.to) : navigate(g.to))}
          >
            <BrandMark className="game-card-icon brand-mark" />
            <h2>{g.title}</h2>
            <p className="game-card-blurb">{g.blurb}</p>
            <p className="game-card-stats">{g.stats}</p>
            <span className="game-card-cta">Play →</span>
          </button>
        ))}
        {COMING_SOON.map((g, i) => (
          <div key={i} className="game-card game-card-locked">
            <span className="game-card-icon" aria-hidden="true">
              {g.icon}
            </span>
            <h2>{g.title}</h2>
            <p className="game-card-blurb">More cricket games are on the way.</p>
          </div>
        ))}
      </main>

      <p className="footnote">A growing collection of cricket trivia and puzzle games.</p>

      {pendingGame && (
        <DifficultyDialog
          onSelect={(key) => navigate(`${pendingGame}?difficulty=${key}`)}
          onCancel={() => setPendingGame(null)}
        />
      )}
    </div>
  );
}
