/**
 * Match-start umpire validation and resolution.
 *
 * Primary contract (Match Start UI):
 * - `mainUmpireId`: required Umpire ObjectId
 * - `legUmpireId`: optional Umpire ObjectId (must differ from main)
 *
 * Legacy (backward compatible):
 * - `umpires`: string[] of Umpire ObjectIds
 * - `umpireNames`: string[] of manual names
 */

export const normalizeManualUmpireNames = (body = {}) => {
  const fromArray = Array.isArray(body.umpireNames)
    ? body.umpireNames
    : typeof body.umpireNames === "string"
      ? [body.umpireNames]
      : [];

  const fromFields = [
    body.umpire1Name,
    body.umpire2Name,
    body.manualUmpire1,
    body.manualUmpire2,
  ];

  return [...fromArray, ...fromFields]
    .map((n) => String(n || "").trim())
    .filter(Boolean)
    .slice(0, 2);
};

export const normalizeUmpireIds = (umpires) => {
  if (!Array.isArray(umpires)) return [];
  return umpires.map(String).filter(Boolean);
};

export const resolveMatchUmpires = ({ umpireIds = [], manualNames = [] }) => {
  const names = manualNames
    .map((n) => String(n || "").trim())
    .filter(Boolean)
    .slice(0, 2);
  const ids = normalizeUmpireIds(umpireIds);

  if (names.length > 0 && ids.length > 0) {
    return { error: "Provide either umpire selections or manual names, not both" };
  }

  if (names.length > 0) {
    return { umpireIds: [], umpireNames: names };
  }

  if (ids.length > 0) {
    return { umpireIds: ids, umpireNames: [] };
  }

  return { umpireIds: [], umpireNames: [] };
};

/** Parse and validate umpire input from a start-match request body. */
export const prepareStartMatchUmpires = (body = {}) => {
  const mainId = body.mainUmpireId != null ? String(body.mainUmpireId).trim() : "";
  const legId = body.legUmpireId != null ? String(body.legUmpireId).trim() : "";

  if (mainId || legId || body.mainUmpireId != null || body.legUmpireId != null) {
    if (!mainId) {
      return { ok: false, error: "Main umpire is required" };
    }
    if (legId && legId === mainId) {
      return { ok: false, error: "Main and leg umpire must be different people" };
    }

    const umpireIds = legId ? [mainId, legId] : [mainId];
    return {
      ok: true,
      umpireIds,
      umpireNames: [],
      source: "database",
    };
  }

  const manualNames = normalizeManualUmpireNames(body);
  const umpireIds = normalizeUmpireIds(body.umpires);
  const resolved = resolveMatchUmpires({ umpireIds, manualNames });

  if (resolved.error) {
    return { ok: false, error: resolved.error };
  }

  return {
    ok: true,
    umpireIds: resolved.umpireIds,
    umpireNames: resolved.umpireNames,
    source:
      resolved.umpireNames.length > 0
        ? "manual"
        : resolved.umpireIds.length > 0
          ? "database"
          : "none",
  };
};
