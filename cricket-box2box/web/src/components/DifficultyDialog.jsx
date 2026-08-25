import { DIFFICULTIES } from "../game/difficulty";

export default function DifficultyDialog({ title = "Pick your delivery", warning, current, onSelect, onCancel }) {
  return (
    <div
      className="toast"
      onClick={(e) => {
        if (onCancel && e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="toast-box" role="alertdialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {warning && <p className="difficulty-warning">{warning}</p>}
        <div className="difficulty-options">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              className={`difficulty-option${d.key === current ? " active" : ""}`}
              onClick={() => onSelect(d.key)}
            >
              <span className="difficulty-tier">{d.tier}</span>
              <span className="difficulty-label">{d.label}</span>
              <span className="difficulty-blurb">{d.blurb}</span>
            </button>
          ))}
        </div>
        {onCancel && (
          <div className="confirm-actions">
            <button className="btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
