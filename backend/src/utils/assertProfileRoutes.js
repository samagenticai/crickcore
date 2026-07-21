/**
 * Assert critical API routes are registered on the profile router.
 * Fails process startup if any required route is missing.
 */
export const REQUIRED_PROFILE_ROUTES = [
  { method: "get", path: "/" },
  { method: "put", path: "/" },
  { method: "put", path: "/password" },
  { method: "post", path: "/avatar" },
  { method: "delete", path: "/avatar" },
];

export function getProfileRouteManifest(profileRouter) {
  return (profileRouter?.stack || [])
    .filter((layer) => layer.route)
    .map((layer) => {
      const methods = Object.keys(layer.route.methods || {})
        .filter((m) => layer.route.methods[m])
        .map((m) => m.toUpperCase());
      return {
        methods,
        path: layer.route.path,
        fullPath: `/api/profile${layer.route.path === "/" ? "" : layer.route.path}`,
      };
    });
}

export function assertProfileRoutesRegistered(profileRouter) {
  const layers = (profileRouter?.stack || []).filter((layer) => layer.route);
  const missing = [];

  for (const required of REQUIRED_PROFILE_ROUTES) {
    const found = layers.some((layer) => {
      const hasMethod = Boolean(layer.route.methods?.[required.method]);
      return hasMethod && layer.route.path === required.path;
    });
    if (!found) {
      const full =
        required.path === "/"
          ? `${required.method.toUpperCase()} /api/profile`
          : `${required.method.toUpperCase()} /api/profile${required.path}`;
      missing.push(full);
    }
  }

  if (missing.length) {
    console.error("[FATAL] Profile API routes missing:");
    missing.forEach((r) => console.error(`  - ${r}`));
    process.exit(1);
  }

  return getProfileRouteManifest(profileRouter);
}

export function printProfileRoutes(manifest) {
  console.log("\n=== Profile API registered ===");
  manifest.forEach((r) => {
    console.log(`  ${r.methods.join(",").padEnd(8)} ${r.fullPath || `/api/profile${r.path}`}`);
  });
  console.log("================================\n");
}
