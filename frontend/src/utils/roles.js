export const ROLES = {
  ADMIN: "admin",
  ORGANIZER: "organizer",
  SCORER: "scorer",
  VIEWER: "viewer",
};

export function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (Object.values(ROLES).includes(value)) return value;
  return ROLES.ORGANIZER;
}

export function isAdminUser(user) {
  return normalizeRole(user?.role) === ROLES.ADMIN;
}

export function hasDashboardAccess(user) {
  const role = normalizeRole(user?.role);
  return role === ROLES.ADMIN || role === ROLES.ORGANIZER || role === ROLES.SCORER;
}

export function canAccessOrganizerDashboard(user) {
  const role = normalizeRole(user?.role);
  return role === ROLES.ORGANIZER || role === ROLES.SCORER;
}

export function getPostLoginPath(userOrRole) {
  const role =
    typeof userOrRole === "string" ? normalizeRole(userOrRole) : normalizeRole(userOrRole?.role);

  if (role === ROLES.ADMIN) return "/admin";
  if (role === ROLES.ORGANIZER || role === ROLES.SCORER) return "/dashboard";
  return "/viewer";
}
