import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories, fetchPlayers, createPlayer, updatePlayer, deletePlayer } from "./adminApi";
import PlayerEditor from "./PlayerEditor";

export default function AdminApp() {
  const [categories, setCategories] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [nationFilter, setNationFilter] = useState("all");
  const [franchiseFilter, setFranchiseFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [editing, setEditing] = useState(null); // { mode: "new" | "edit", name?, categoryIds? }
  const [confirmDelete, setConfirmDelete] = useState(null);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const nations = useMemo(() => categories.filter((c) => c.type === 1), [categories]);
  const nationIds = useMemo(() => new Set(nations.map((n) => n.id)), [nations]);
  const franchises = useMemo(() => categories.filter((c) => c.type === 2), [categories]);
  const awardTypes = useMemo(() => new Set([3, 4, 5]), []);
  const seasonOptions = useMemo(() => {
    const set = new Set();
    for (const p of players) for (const s of p.seasons || []) set.add(s);
    return [...set].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [players]);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([fetchCategories(), fetchPlayers()])
      .then(([cats, pls]) => {
        setCategories(cats);
        setPlayers(pls);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    document.title = "IPL Grid Admin — Cross Bat";
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nationId = nationFilter === "all" || nationFilter === "none" ? null : Number(nationFilter);
    const franchiseId = franchiseFilter === "all" ? null : Number(franchiseFilter);
    return players.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (nationFilter === "none" && p.categoryIds.some((id) => nationIds.has(id))) return false;
      if (nationId != null && !p.categoryIds.includes(nationId)) return false;
      if (franchiseId != null && !p.categoryIds.includes(franchiseId)) return false;
      if (seasonFilter !== "all" && !(p.seasons || []).includes(seasonFilter)) return false;
      return true;
    });
  }, [players, query, nationFilter, franchiseFilter, seasonFilter, nationIds]);

  const filtersActive = query || nationFilter !== "all" || franchiseFilter !== "all" || seasonFilter !== "all";

  function clearFilters() {
    setQuery("");
    setNationFilter("all");
    setFranchiseFilter("all");
    setSeasonFilter("all");
  }

  async function handleSave(payload) {
    if (editing.mode === "new") {
      await createPlayer(payload.name, payload.categoryIds);
    } else {
      await updatePlayer(editing.name, payload.name, payload.categoryIds);
    }
    setEditing(null);
    load();
  }

  async function handleDelete(name) {
    if (confirmDelete !== name) {
      setConfirmDelete(name);
      return;
    }
    setConfirmDelete(null);
    await deletePlayer(name);
    load();
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <div>
          <h1>IPL Grid — Data Admin</h1>
          <p>{players.length} players · edits save straight to the live dataset.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-link" to="/ipl-grid">
            ← Back to game
          </Link>
          <Link className="admin-link" to="/ipl-grid/admin/awards">
            Awards review →
          </Link>
          <button
            className="btn-primary"
            onClick={() => setEditing({ mode: "new", name: "", categoryIds: [] })}
          >
            + Add player
          </button>
        </div>
      </header>

      {error && <p className="error-banner">{error}</p>}

      <input
        className="admin-search"
        type="text"
        placeholder="Search players…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="admin-filters">
        <select value={nationFilter} onChange={(e) => setNationFilter(e.target.value)}>
          <option value="all">All nations</option>
          <option value="none">No nation</option>
          {nations.map((n) => (
            <option key={n.id} value={n.id}>
              {n.displayName}
            </option>
          ))}
        </select>
        <select value={franchiseFilter} onChange={(e) => setFranchiseFilter(e.target.value)}>
          <option value="all">All IPL teams</option>
          {franchises.map((f) => (
            <option key={f.id} value={f.id}>
              {f.displayName}
              {!f.active ? " (retired)" : ""}
            </option>
          ))}
        </select>
        <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}>
          <option value="all">All IPL years</option>
          {seasonOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {filtersActive && (
          <button className="btn-ghost" onClick={clearFilters}>
            Clear filters
          </button>
        )}
        <span className="admin-filter-count">
          {filtered.length} of {players.length}
        </span>
      </div>

      {loading ? (
        <p className="loading">Loading…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Nation</th>
                <th>Franchises</th>
                <th>IPL years</th>
                <th>Awards</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const cats = p.categoryIds.map((id) => categoryById.get(id)).filter(Boolean);
                const nation = cats.find((c) => c.type === 1);
                const rowFranchises = cats.filter((c) => c.type === 2);
                const rowAwards = cats.filter((c) => awardTypes.has(c.type));
                const seasons = p.seasons || [];
                const span = seasons.length
                  ? seasons.length === 1
                    ? seasons[0]
                    : `${seasons[0]}–${seasons[seasons.length - 1]}`
                  : null;
                return (
                  <tr key={p.name}>
                    <td className="admin-name">{p.name}</td>
                    <td>{nation ? <span className="tag">{nation.displayName}</span> : <span className="tag-empty">—</span>}</td>
                    <td>
                      <div className="admin-franchises">
                        {rowFranchises.length
                          ? rowFranchises.map((f) => (
                              <span key={f.id} className="tag">
                                {f.displayName}
                              </span>
                            ))
                          : <span className="tag-empty">—</span>}
                      </div>
                    </td>
                    <td className="admin-seasons" title={seasons.join(", ")}>
                      {span || <span className="tag-empty">no match data</span>}
                    </td>
                    <td>
                      <div className="admin-franchises">
                        {rowAwards.length
                          ? rowAwards.map((a) => (
                              <span key={a.id} className="tag">
                                {a.displayName}
                              </span>
                            ))
                          : <span className="tag-empty">—</span>}
                      </div>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="btn-ghost" onClick={() => setEditing({ mode: "edit", name: p.name, categoryIds: p.categoryIds })}>
                          Edit
                        </button>
                        <button
                          className={confirmDelete === p.name ? "btn-danger" : "btn-ghost"}
                          onClick={() => handleDelete(p.name)}
                          onBlur={() => setConfirmDelete((c) => (c === p.name ? null : c))}
                        >
                          {confirmDelete === p.name ? "Confirm?" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    No players match the current search/filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <PlayerEditor
          categories={categories}
          initialName={editing.name}
          initialCategoryIds={editing.categoryIds}
          isNew={editing.mode === "new"}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
