const BASE = `${import.meta.env.VITE_API_BASE || "https://cross-bat.onrender.com"}/api/admin`;

async function json(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `request failed (${res.status})`);
  }
  return res.json();
}

export function fetchCategories() {
  return fetch(`${BASE}/categories`).then(json).then((d) => d.categories);
}

export function fetchPlayers() {
  return fetch(`${BASE}/players`).then(json).then((d) => d.players);
}

export function createPlayer(name, categoryIds) {
  return fetch(`${BASE}/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, categoryIds }),
  }).then(json);
}

export function updatePlayer(currentName, name, categoryIds) {
  return fetch(`${BASE}/players/${encodeURIComponent(currentName)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, categoryIds }),
  }).then(json);
}

export function deletePlayer(name) {
  return fetch(`${BASE}/players/${encodeURIComponent(name)}`, { method: "DELETE" }).then(json);
}
