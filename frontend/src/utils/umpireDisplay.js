/** Format umpire names for live match display (populated docs or legacy strings). */
export function formatMatchUmpires(match) {
  const populated = match?.umpires || [];
  if (populated.length > 0) {
    return populated.map((u) => {
      if (typeof u === "string") return u;
      const name = u.fullName || u.name || "Umpire";
      const type = u.umpireType ? ` (${u.umpireType})` : "";
      return `${name}${type}`;
    });
  }
  if (match?.umpireNames?.length) {
    return match.umpireNames.filter(Boolean);
  }
  return [];
}

export function formatMatchUmpiresLine(match) {
  const list = formatMatchUmpires(match);
  if (!list.length) return null;
  if (list.length === 1) return `Umpire: ${list[0]}`;
  return `Umpires: ${list.join(" · ")}`;
}
