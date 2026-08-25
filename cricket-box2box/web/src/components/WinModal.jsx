export default function WinModal({ onPlayAgain, onClose }) {
  return (
    <div
      className="toast win-toast"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="toast-box" role="dialog" aria-modal="true" aria-label="Grid complete">
        <h2>🏆 Full House!</h2>
        <p>Nine cells, zero repeats. That's an innings well played.</p>
        <div className="confirm-actions">
          <button className="btn-ghost" onClick={onClose}>
            Admire the board
          </button>
          <button className="btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
