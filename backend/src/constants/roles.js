/** Canonical lowercase roles stored in the database */
export const ROLES = {
  ADMIN: "admin",
  ORGANIZER: "organizer",
  SCORER: "scorer",
  VIEWER: "viewer",
};

/** Roles assignable through public registration — never includes admin */
export const PUBLIC_REGISTER_ROLES = [ROLES.ORGANIZER, ROLES.SCORER, ROLES.VIEWER];

/** Roles that may use the organizer dashboard and tournament APIs */
export const DASHBOARD_ROLES = [ROLES.ORGANIZER, ROLES.SCORER];

export const ADMIN_ROLE = ROLES.ADMIN;

const LEGACY_ROLE_MAP = {
  admin: ROLES.ADMIN,
  organizer: ROLES.ORGANIZER,
  scorer: ROLES.SCORER,
  viewer: ROLES.VIEWER,
};

/** Normalize legacy Title Case values and unknown input to lowercase roles */
export function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (LEGACY_ROLE_MAP[value]) return LEGACY_ROLE_MAP[value];
  return ROLES.ORGANIZER;
}

export function isAdminRole(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

export function hasDashboardAccess(role) {
  const normalized = normalizeRole(role);
  return normalized === ROLES.ADMIN || DASHBOARD_ROLES.includes(normalized);
}

export function getLoginRedirect(role) {
  if (isAdminRole(role)) return "/admin";
  if (DASHBOARD_ROLES.includes(normalizeRole(role))) return "/dashboard";
  return "/viewer";
}
