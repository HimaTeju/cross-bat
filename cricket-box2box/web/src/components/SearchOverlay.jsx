import { useEffect, useRef, useState } from "react";
import { searchPlayers } from "../api";

export default function SearchOverlay({ clue, usedPlayers, onGuess, onClose }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef(null);
  const requestId = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    setFeedback("");
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const id = ++requestId.current;
    searchPlayers(q, usedPlayers).then((results) => {
      if (id === requestId.current) setSuggestions(results);
    });
  }, [query, usedPlayers]);

  async function pick(name) {
    const result = await onGuess(name);
    if (!result.correct) {
      setFeedback(`${result.name || name} didn't play for both — try again.`);
      setSuggestions([]);
      setQuery("");
      inputRef.current?.focus();
    }
  }

  return (
    <div
      className="search-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="search-box" role="dialog" aria-modal="true" aria-label="Guess a player">
        <div className="search-clue">{clue}</div>
        <input
          id="search-input"
          ref={inputRef}
          type="text"
          placeholder="Type a cricketer's name…"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
        />
        <p className="search-feedback">{feedback}</p>
        <ul className="suggestions">
          {suggestions.map((name) => (
            <li key={name} onClick={() => pick(name)}>
              {name}
            </li>
          ))}
        </ul>
        <button className="btn-ghost search-close" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
