/** Resolve populated or legacy tournament venue for display */
export function getTournamentVenue(tournament) {
  const v = tournament?.venue;

  if (v && typeof v === "object" && v.venueName) {
    return {
      id: v._id,
      venueName: v.venueName,
      groundAddress: v.groundAddress || "",
      city: v.city || "",
      state: v.state || "",
      country: v.country || "",
      pitchType: v.pitchType || "Turf",
      capacity: v.capacity,
      locationLine: [v.city, v.country].filter(Boolean).join(", "),
      shortLabel: v.venueName,
    };
  }

  // Legacy text fields (pre-integration tournaments)
  const legacyName = tournament?.groundName || (typeof v === "string" ? v : "");
  const legacyCity = tournament?.city || "";
  if (legacyName || legacyCity || tournament?.groundAddress) {
    return {
      id: null,
      venueName: legacyName || "Venue TBD",
      groundAddress: tournament?.groundAddress || "",
      city: legacyCity,
      state: "",
      country: "",
      pitchType: null,
      capacity: null,
      locationLine: legacyCity,
      shortLabel: legacyName || legacyCity || "Venue TBD",
    };
  }

  return null;
}

export function tournamentVenueLabel(tournament) {
  const info = getTournamentVenue(tournament);
  if (!info) return "—";
  return info.locationLine ? `${info.venueName} · ${info.locationLine}` : info.venueName;
}
