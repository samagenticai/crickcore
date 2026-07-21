/**
 * Normalize tournament documents from the API into a stable client shape.
 */
export function normalizeTournament(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.id || raw._id;
  if (!id) return null;

  return {
    ...raw,
    id,
    _id: id,
    teams: Array.isArray(raw.teams) ? raw.teams : [],
  };
}

export function normalizeTournamentList(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeTournament).filter(Boolean);
}

export function normalizePagination(raw, fallbackPage = 1) {
  if (!raw || typeof raw !== "object") {
    return { page: fallbackPage, limit: 12, total: 0, pages: 1 };
  }
  return {
    page: Number(raw.page) || fallbackPage,
    limit: Number(raw.limit) || 12,
    total: Number(raw.total) || 0,
    pages: Math.max(1, Number(raw.pages) || 1),
  };
}

export function normalizeTournamentStats(raw) {
  const d = raw && typeof raw === "object" ? raw : {};
  return {
    total: Number(d.total) || 0,
    upcoming: Number(d.upcoming) || 0,
    live: Number(d.live) || 0,
    completed: Number(d.completed) || 0,
    draft: Number(d.draft) || 0,
    cancelled: Number(d.cancelled) || 0,
  };
}
