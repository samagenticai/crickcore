/**
 * Build start-match umpire payload from saved Umpires module selections.
 */
export function buildMatchUmpirePayload({ mainUmpireId = "", legUmpireId = "" }) {
  const main = String(mainUmpireId || "").trim();
  const leg = String(legUmpireId || "").trim();

  if (!main) return {};

  return {
    mainUmpireId: main,
    ...(leg && leg !== main ? { legUmpireId: leg } : {}),
  };
}
