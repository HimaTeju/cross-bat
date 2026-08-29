import { Link } from "react-router-dom";

export default function WinModal({ onPlayAgain }) {
  return (
    <div className="toast win-toast">
      <div className="toast-box" role="dialog" aria-modal="true" aria-label="Grid complete">
        <h2>🏆 Full House!</h2>
        <p>Nine cells, zero repeats. That's an innings well played.</p>
        <div className="confirm-actions">
          <button className="btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
          <Link className="btn-ghost" to="/">
            Other Games
          </Link>
        </div>
      </div>
    </div>
  );
}
