export const ROLE_META = {
  Batsman: { label: "Batsman" },
  Bowler: { label: "Bowler" },
  "All-Rounder": { label: "All-Rounder" },
  "Wicket-Keeper": { label: "Wicket Keeper" },
};

export const MAX_WICKET_KEEPERS = 2;

const ROLE_SORT_ORDER = {
  Batsman: 1,
  "Wicket-Keeper": 2,
  "All-Rounder": 3,
  Bowler: 4,
};

/** Batsmen → Wicket Keepers → All-Rounders → Bowlers */
export const sortPlayersByRole = (players = []) =>
  [...players].sort((a, b) => {
    const orderA = ROLE_SORT_ORDER[a?.role] ?? 99;
    const orderB = ROLE_SORT_ORDER[b?.role] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    const jerseyA = a?.jerseyNumber ?? 999;
    const jerseyB = b?.jerseyNumber ?? 999;
    if (jerseyA !== jerseyB) return jerseyA - jerseyB;
    return (a?.name || "").localeCompare(b?.name || "");
  });

export const countSelectedWicketKeepers = (selectedIds = [], squad = []) => {
  const selected = new Set(selectedIds.map(String));
  return squad.filter((p) => selected.has(String(p._id)) && p.role === "Wicket-Keeper").length;
};

export const playerId = (player) => String(player?._id || player || "");

export const canPlayerBowl = (role) => role === "Bowler" || role === "All-Rounder";

export const formatPlayerRole = (role) => {
  const meta = ROLE_META[role];
  return meta ? meta.label : role || "—";
};

/** Live score dropdown label: "Ahmed Khan — Batsman" */
export const formatPlayerSelectLabel = (player, tag = "") => {
  const name = player?.name || "Player";
  const role = formatPlayerRole(player?.role);
  const base = `${name} — ${role}`;
  return tag ? `${base} (${tag})` : base;
};

export const formatPlayerWithRole = (player) => {
  const jersey = player?.jerseyNumber != null ? ` (#${player.jerseyNumber})` : "";
  return `${player?.name || "Player"}${jersey} — ${formatPlayerRole(player?.role)}`;
};

export const filterEligibleBowlers = (players = []) =>
  players.filter((p) => canPlayerBowl(p?.role));

/** Batsmen available to come in — not out, not currently at the crease. */
/** Player IDs who are out or have already faced (not yet_to_bat). */
export const collectUnavailableBatsmanIds = (liveScore, scorecard) => {
  const ids = new Set();
  (liveScore?.dismissedPlayers || []).forEach((id) => ids.add(String(id)));
  (scorecard?.batting || [])
    .filter((b) => b.status !== "yet_to_bat")
    .forEach((b) => ids.add(String(b.playerId)));
  return [...ids];
};

export const filterAvailableNewBatsmen = (
  players = [],
  { striker, nonStriker, dismissedIds = [], unavailableIds = [] } = {}
) => {
  const unavailable = new Set([...dismissedIds, ...unavailableIds].map(String));
  const strikerId = striker ? playerId(striker) : null;
  const nonStrikerId = nonStriker ? playerId(nonStriker) : null;

  const filtered = players.filter((p) => {
    const id = playerId(p);
    if (unavailable.has(id)) return false;
    if (strikerId && id === strikerId) return false;
    if (nonStrikerId && id === nonStrikerId) return false;
    return true;
  });

  return sortPlayersByRole(filtered);
};

export const collectDismissedPlayerIds = (liveScore, scorecard) => {
  const ids = new Set();
  (liveScore?.dismissedPlayers || []).forEach((id) => ids.add(String(id)));
  (scorecard?.batting || [])
    .filter((b) => b.status === "out")
    .forEach((b) => ids.add(String(b.playerId)));
  return [...ids];
};
