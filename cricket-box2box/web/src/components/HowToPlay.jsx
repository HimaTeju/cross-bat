import Board from "./Board";

const nation = (id, name, displayName) => ({ id, name, displayName, type: 1 });
const franchise = (id, name, displayName) => ({ id, name, displayName, type: 2, active: true });

const DEMO_ROWS = [
  nation(1, "India", "India"),
  nation(2, "Australia", "Australia"),
  nation(3, "West Indies", "West Indies"),
];

const DEMO_COLS = [
  franchise(1, "Royal Challengers Bengaluru", "RCB"),
  franchise(2, "Mumbai Indians", "MI"),
  franchise(3, "Sunrisers Hyderabad", "SRH"),
];

// Real answers, verified against the underlying Cricsheet-derived dataset.
const DEMO_CELLS = [
  [{ name: "Virat Kohli" }, { name: "Sachin Tendulkar" }, { name: "Yuvraj Singh" }],
  [null, null, { name: "David Warner" }],
  [{ name: "Chris Gayle" }, null, null],
];

const noop = () => {};

export default function HowToPlay({ onClose }) {
  return (
    <div className="toast">
      <div className="toast-box wide">
        <h2>How to play</h2>
        <ul className="rules">
          <li>
            Each row and column is a national side or an IPL franchise — including five that no
            longer exist.
          </li>
          <li>
            Click a cell and name a cricketer who played for <em>both</em> the row and the
            column.
          </li>
          <li>Every player can only be used once across the whole board.</li>
          <li>Fill all nine cells to complete the grid.</li>
        </ul>

        <div className="demo-board-wrap">
          <Board rows={DEMO_ROWS} cols={DEMO_COLS} cellState={DEMO_CELLS} onOpenCell={noop} shakeMap={{}} />
        </div>
        <p className="demo-caption">
          Example: <strong>India × RCB</strong> → Virat Kohli. The empty cells, like{" "}
          <strong>Australia × RCB</strong>, are the ones you'd click and search a name for.
        </p>

        <button className="btn-primary" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
