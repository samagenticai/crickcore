/** Canonical tournamentType values — must match frontend dropdown values exactly. */
export const TOURNAMENT_TYPES = [
  "Group Stage",
  "Knockout (Single Elimination)",
  "Round Robin (League)",
  "Double Round Robin",
  "Hybrid (Group Stage + Knockout)",
];

/** Map legacy stored values (pre-standardization) to canonical types. */
export const LEGACY_TOURNAMENT_TYPE_MAP = {
  Knockout: "Knockout (Single Elimination)",
  "Round Robin": "Round Robin (League)",
  League: "Round Robin (League)",
  Hybrid: "Hybrid (Group Stage + Knockout)",
  "Group Stage + Knockout": "Hybrid (Group Stage + Knockout)",
};

export const resolveTournamentType = (type) =>
  LEGACY_TOURNAMENT_TYPE_MAP[type] || type;

export const isKnockoutType = (type) =>
  type === "Knockout (Single Elimination)" || type === "Knockout";

export const isRoundRobinLeagueType = (type) =>
  type === "Round Robin (League)" || type === "Round Robin" || type === "League";

export const isHybridType = (type) =>
  type === "Hybrid (Group Stage + Knockout)" ||
  type === "Group Stage + Knockout" ||
  type === "Hybrid";

export const isGroupStageType = (type) => type === "Group Stage";
