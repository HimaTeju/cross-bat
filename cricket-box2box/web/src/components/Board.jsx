import HeaderCell from "./HeaderCell";
import GridCell from "./GridCell";

export default function Board({ rows, cols, cellState, counts, onOpenCell, shakeMap }) {
  return (
    <div className="board">
      <div className="corner">🏏 XB</div>
      {cols.map((c) => (
        <HeaderCell key={c.id} category={c} />
      ))}
      {rows.map((r, ri) => (
        <RowCells
          key={r.id}
          rowCat={r}
          cols={cols}
          ri={ri}
          cellState={cellState}
          counts={counts}
          onOpenCell={onOpenCell}
          shakeMap={shakeMap}
        />
      ))}
    </div>
  );
}

function RowCells({ rowCat, cols, ri, cellState, counts, onOpenCell, shakeMap }) {
  return (
    <>
      <HeaderCell category={rowCat} />
      {cols.map((c, ci) => {
        const key = `${ri}-${ci}`;
        const state = cellState[ri][ci];
        return (
          <GridCell
            key={key}
            filled={Boolean(state)}
            playerName={state?.name}
            count={counts?.[ri]?.[ci]}
            onOpen={() => onOpenCell(ri, ci)}
            shakeToken={shakeMap[key] || 0}
          />
        );
      })}
    </>
  );
}
