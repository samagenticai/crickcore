import Umpire from "../models/Umpire.js";

export async function setUmpiresBusy(umpireIds = [], organizerId) {
  const ids = umpireIds.map(String).filter(Boolean);
  if (!ids.length || !organizerId) return;

  await Umpire.updateMany(
    { _id: { $in: ids }, organizerId, status: "Available" },
    { status: "Busy" }
  );
}

export async function setUmpiresAvailable(umpireIds = [], organizerId) {
  const ids = umpireIds.map(String).filter(Boolean);
  if (!ids.length || !organizerId) return;

  await Umpire.updateMany(
    { _id: { $in: ids }, organizerId },
    { status: "Available" }
  );
}

export function extractMatchUmpireIds(match) {
  if (!match?.umpires?.length) return [];
  return match.umpires.map((u) => String(u._id || u)).filter(Boolean);
}
