const BASE = `${import.meta.env.VITE_API_BASE || "https://cross-bat.onrender.com"}/api`;

async function json(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `request failed (${res.status})`);
  }
  return res.json();
}

export function fetchGrid() {
  return fetch(`${BASE}/grid`).then(json);
}

export function searchPlayers(query, exclude) {
  const params = new URLSearchParams({ q: query });
  if (exclude?.length) params.set("exclude", exclude.join(","));
  return fetch(`${BASE}/players/search?${params}`).then(json).then((d) => d.results);
}

export function submitGuess(rowId, colId, name) {
  return fetch(`${BASE}/guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rowId, colId, name }),
  }).then(json);
}
