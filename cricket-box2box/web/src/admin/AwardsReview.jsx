import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchStagedAwards,
  approveStagedAward,
  rejectStagedAward,
  searchPlayersAdmin,
} from "./adminApi";

const MATCH_LABEL = {
  exact: "exact match",
  fuzzy: "likely match",
  ambiguous: "ambiguous",
  unmatched: "no match",
};

function ReassignBox({ entry, onPick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    searchPlayersAdmin(query).then((r) => {
      if (!cancelled) setResults(r);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="awards-reassign">
      <input
        type="text"
        placeholder={`search for "${entry.rawName}"…`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <div className="awards-reassign-results">
          {results.map((name) => (
            <button key={name} className="btn-ghost" onClick={() => onPick(name)}>
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AwardsReview() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [awardFilter, setAwardFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [reassigning, setReassigning] = useState(null); // entry id currently showing search box

  function load() {
    setLoading(true);
    setError(null);
    fetchStagedAwards()
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    document.title = "Awards Review — Cross Bat Admin";
  }, []);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    for (const e of entries) c[e.status] = (c[e.status] || 0) + 1;
    return c;
  }, [entries]);

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (statusFilter !== "all" && e.status !== statusFilter) return false;
        if (awardFilter !== "all" && e.award !== awardFilter) return false;
        return true;
      }),
    [entries, statusFilter, awardFilter]
  );

  async function approve(entry, name) {
    setBusyId(entry.id);
    setError(null);
    try {
      await approveStagedAward(entry.id, name);
      setReassigning(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function reject(entry) {
    setBusyId(entry.id);
    setError(null);
    try {
      await rejectStagedAward(entry.id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <div>
          <h1>Awards Review</h1>
          <p>
            {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected — approving
            an entry is what makes it count in the actual game.
          </p>
        </div>
        <div className="admin-actions">
          <Link className="admin-link" to="/ipl-grid/admin">
            ← Back to players
          </Link>
        </div>
      </header>

      {error && <p className="error-banner">{error}</p>}

      <div className="admin-filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
        <select value={awardFilter} onChange={(e) => setAwardFilter(e.target.value)}>
          <option value="all">All awards</option>
          <option value="orange_cap">Orange Cap</option>
          <option value="purple_cap">Purple Cap</option>
          <option value="mvp">MVP</option>
        </select>
        <span className="admin-filter-count">
          {filtered.length} of {entries.length}
        </span>
      </div>

      {loading ? (
        <p className="loading">Loading…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Season</th>
                <th>Award</th>
                <th>Reported</th>
                <th>Match</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>{e.season}</td>
                  <td>{e.awardLabel}</td>
                  <td>
                    <div className="admin-name">{e.rawName}</div>
                    <div className="awards-evidence">
                      {e.team} · {e.stat}
                    </div>
                    {e.note && <div className="awards-note">⚠ {e.note}</div>}
                  </td>
                  <td>
                    <span className={`awards-badge awards-badge-${e.matchType}`}>
                      {MATCH_LABEL[e.matchType]}
                    </span>
                    {e.matchedName && <div className="admin-name">{e.matchedName}</div>}
                    {e.matchType === "ambiguous" && (
                      <div className="awards-candidates">
                        {e.candidates.map((c) => (
                          <button
                            key={c}
                            className="btn-ghost"
                            disabled={busyId === e.id}
                            onClick={() => approve(e, c)}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                    {e.status === "pending" &&
                      (reassigning === e.id ? (
                        <ReassignBox entry={e} onPick={(name) => approve(e, name)} />
                      ) : (
                        e.matchType !== "ambiguous" && (
                          <button className="btn-ghost awards-fix-link" onClick={() => setReassigning(e.id)}>
                            {e.matchType === "unmatched" ? "find player…" : "wrong player?"}
                          </button>
                        )
                      ))}
                  </td>
                  <td>
                    {e.status === "pending" ? (
                      <div className="admin-row-actions">
                        <button
                          className="btn-primary"
                          disabled={busyId === e.id || !e.matchedName}
                          onClick={() => approve(e, e.matchedName)}
                        >
                          Approve
                        </button>
                        <button className="btn-danger" disabled={busyId === e.id} onClick={() => reject(e)}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="tag-empty">{e.status}</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    Nothing here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
