import { useState } from "react";

export default function PlayerEditor({ categories, initialName, initialCategoryIds, isNew, onCancel, onSave }) {
  const [name, setName] = useState(initialName || "");
  const [nationId, setNationId] = useState(
    () => categories.find((c) => c.type === 1 && initialCategoryIds.includes(c.id))?.id ?? null
  );
  const [franchiseIds, setFranchiseIds] = useState(
    () => new Set(initialCategoryIds.filter((id) => categories.find((c) => c.id === id)?.type === 2))
  );
  const [awardIds, setAwardIds] = useState(
    () => new Set(initialCategoryIds.filter((id) => [3, 4, 5].includes(categories.find((c) => c.id === id)?.type)))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const nations = categories.filter((c) => c.type === 1);
  const franchises = categories.filter((c) => c.type === 2);
  const awards = categories.filter((c) => [3, 4, 5].includes(c.type));

  function toggleFranchise(id) {
    setFranchiseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAward(id) {
    setAwardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    const categoryIds = [...(nationId != null ? [nationId] : []), ...franchiseIds, ...awardIds];
    try {
      await onSave({ name: name.trim(), categoryIds });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="admin-modal" role="dialog" aria-modal="true">
        <h2>{isNew ? "Add player" : `Edit ${initialName}`}</h2>

        <label className="admin-field">
          <span>Name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>

        <fieldset className="admin-field">
          <legend>Nation</legend>
          <div className="admin-radio-row">
            <label className="admin-radio">
              <input type="radio" name="nation" checked={nationId == null} onChange={() => setNationId(null)} />
              None
            </label>
            {nations.map((n) => (
              <label key={n.id} className="admin-radio">
                <input type="radio" name="nation" checked={nationId === n.id} onChange={() => setNationId(n.id)} />
                {n.displayName}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="admin-field">
          <legend>Franchises</legend>
          <div className="admin-checkbox-grid">
            {franchises.map((f) => (
              <label key={f.id} className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={franchiseIds.has(f.id)}
                  onChange={() => toggleFranchise(f.id)}
                />
                {f.displayName}
                {!f.active && <span className="admin-retired"> (retired)</span>}
              </label>
            ))}
          </div>
        </fieldset>

        {awards.length > 0 && (
          <fieldset className="admin-field">
            <legend>Awards</legend>
            <div className="admin-checkbox-grid">
              {awards.map((a) => (
                <label key={a.id} className="admin-checkbox">
                  <input type="checkbox" checked={awardIds.has(a.id)} onChange={() => toggleAward(a.id)} />
                  {a.displayName}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {error && <p className="error-banner">{error}</p>}

        <div className="admin-modal-actions">
          <button className="btn-ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
