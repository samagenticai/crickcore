/** Resolve a display label for match or tournament venue (handles populated venue docs). */
export function matchVenueLabel(match, tournament) {
  const v = match?.venue;
  const name = v?.venueName || v?.name;
  if (name) {
    return v?.city ? `${name}, ${v.city}` : name;
  }

  const tVenue = tournament?.venue;
  if (tVenue && typeof tVenue === "object") {
    const tName = tVenue.venueName || tVenue.name;
    if (tName) {
      return tVenue.city ? `${tName}, ${tVenue.city}` : tName;
    }
  }

  return tournament?.groundName || (typeof tVenue === "string" ? tVenue : "") || tournament?.city || "Venue TBD";
}
