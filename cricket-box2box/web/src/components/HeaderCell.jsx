import { styleFor } from "../teamStyles";

export default function HeaderCell({ category }) {
  const style = styleFor(category);
  return (
    <div className="head" style={{ background: style.bg, color: style.fg }}>
      {category.type === 1 ? (
        <>
          {style.flag && <img className="head-flag" src={style.flag} alt="" />}
          {category.displayName}
        </>
      ) : (
        <>
          {style.logo && <img className="head-logo" src={style.logo} alt="" />}
          {category.displayName}
          <span className="head-sub">{category.active ? "IPL" : "IPL · RETIRED"}</span>
        </>
      )}
    </div>
  );
}
