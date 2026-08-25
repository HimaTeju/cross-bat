import { useEffect, useRef } from "react";

export default function GridCell({ filled, playerName, count, onOpen, shakeToken }) {
  const ref = useRef(null);

  useEffect(() => {
    if (shakeToken && ref.current) {
      ref.current.classList.remove("shake");
      // eslint-disable-next-line no-unused-expressions
      ref.current.offsetWidth;
      ref.current.classList.add("shake");
    }
  }, [shakeToken]);

  if (filled) {
    return (
      <div className="cell filled" ref={ref}>
        <span className="player-name">{playerName}</span>
        <span className="player-tag">✓ Correct</span>
      </div>
    );
  }

  return (
    <div
      className="cell"
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <span className="plus">+</span>
      {count != null && (
        <span className="cell-count">
          {count} {count === 1 ? "player" : "players"}
        </span>
      )}
    </div>
  );
}
