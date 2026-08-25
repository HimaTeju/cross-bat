import { styleFor } from "../teamStyles";

export default function HeaderCell({ category }) {
  const style = styleFor(category);
  return (
    <div className="head" style={{ background: style.bg, color: style.fg }}>
      {category.type === 1 ? (
        <>
          <span className="head-flag">{style.flag || ""}</span>
          {category.displayName}
        </>
      ) : (
        <>
          {category.displayName}
          <span className="head-sub">{category.active ? "IPL" : "IPL · RETIRED"}</span>
        </>
      )}
    </div>
  );
}
