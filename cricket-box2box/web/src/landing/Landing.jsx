import { useEffect } from "react";
import { Link } from "react-router-dom";

const GAMES = [
  {
    to: "/ipl-grid",
    icon: "🏏",
    title: "IPL Grid",
    blurb: "Fill a 3×3 grid connecting national teams and IPL franchises with a real player who played for both.",
    stats: "844 players · 15 franchises · 2008–2026",
  },
];

const COMING_SOON = [
  { icon: "🔒", title: "Coming soon" },
  { icon: "🔒", title: "Coming soon" },
];

export default function Landing() {
  useEffect(() => {
    document.title = "Cross Bat — Cricket Games";
  }, []);

  return (
    <div className="pitch">
      <header className="masthead landing-masthead">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            🏏
          </span>
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
          <Link key={g.to} to={g.to} className="game-card">
            <span className="game-card-icon" aria-hidden="true">
              {g.icon}
            </span>
            <h2>{g.title}</h2>
            <p className="game-card-blurb">{g.blurb}</p>
            <p className="game-card-stats">{g.stats}</p>
            <span className="game-card-cta">Play →</span>
          </Link>
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
    </div>
  );
}
