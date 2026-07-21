/** Format net run rate for display (3 decimal places, optional + prefix). */
export function formatNetRunRate(value) {
  const n = Number(value) || 0;
  const formatted = n.toFixed(3);
  if (n > 0) return `+${formatted}`;
  return formatted;
}

export function nrrTone(value) {
  const n = Number(value) || 0;
  if (n > 0) return "positive";
  if (n < 0) return "negative";
  return "neutral";
}

/** Default competition ranking: points → NRR → wins → name */
export function sortStandingsRows(rows = []) {
  return [...rows].sort(
    (a, b) =>
      (b.points ?? 0) - (a.points ?? 0) ||
      (b.netRunRate ?? b.nrr ?? 0) - (a.netRunRate ?? a.nrr ?? 0) ||
      (b.won ?? 0) - (a.won ?? 0) ||
      String(a.name || "").localeCompare(String(b.name || ""))
  );
}

export function applyStandingsPositions(rows = []) {
  return sortStandingsRows(rows).map((row, index) => ({
    ...row,
    position: index + 1,
    nrr: row.netRunRate ?? row.nrr ?? 0,
  }));
}

export function filterStandingsRows(rows, search = "") {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (t) =>
      String(t.name || "").toLowerCase().includes(q) ||
      String(t.city || "").toLowerCase().includes(q) ||
      String(t.shortName || "").toLowerCase().includes(q)
  );
}

export const STANDINGS_COLUMNS = [
  { key: "position", label: "#", short: "#", sortable: false, align: "center" },
  { key: "name", label: "Team", short: "Team", sortable: true, align: "left" },
  { key: "played", label: "P", short: "P", sortable: true, align: "center", title: "Matches Played" },
  { key: "won", label: "W", short: "W", sortable: true, align: "center", title: "Won" },
  { key: "lost", label: "L", short: "L", sortable: true, align: "center", title: "Lost" },
  { key: "tied", label: "T", short: "T", sortable: true, align: "center", title: "Tied" },
  { key: "noResult", label: "NR", short: "NR", sortable: true, align: "center", title: "No Result" },
  { key: "points", label: "PTS", short: "PTS", sortable: true, align: "center", title: "Points" },
  { key: "netRunRate", label: "NRR", short: "NRR", sortable: true, align: "center", title: "Net Run Rate" },
  { key: "runsScored", label: "RS", short: "RS", sortable: true, align: "center", title: "Runs Scored" },
  { key: "oversFacedDisplay", label: "OF", short: "OF", sortable: false, align: "center", title: "Overs Faced" },
  { key: "runsConceded", label: "RC", short: "RC", sortable: true, align: "center", title: "Runs Conceded" },
  { key: "oversBowledDisplay", label: "OB", short: "OB", sortable: false, align: "center", title: "Overs Bowled" },
];

export const STANDINGS_COLUMNS_COMPACT = STANDINGS_COLUMNS.filter((col) =>
  ["position", "name", "played", "won", "lost", "tied", "noResult", "points", "netRunRate"].includes(col.key)
);
