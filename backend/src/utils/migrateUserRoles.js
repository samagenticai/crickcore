import User from "../models/User.js";
import { ROLES } from "../constants/roles.js";

const LEGACY_TO_CANONICAL = {
  Admin: ROLES.ADMIN,
  Organizer: ROLES.ORGANIZER,
  Scorer: ROLES.SCORER,
  Viewer: ROLES.VIEWER,
};

/** One-time style migration for existing Title Case / mixed-case role values */
export async function migrateUserRoles() {
  let updated = 0;

  for (const [legacy, canonical] of Object.entries(LEGACY_TO_CANONICAL)) {
    const result = await User.updateMany({ role: legacy }, { $set: { role: canonical } });
    updated += result.modifiedCount || 0;
  }

  // Catch any remaining non-canonical roles via case-insensitive match
  const users = await User.find({
    role: { $nin: Object.values(ROLES) },
  }).select("_id role");

  for (const user of users) {
    const canonical = LEGACY_TO_CANONICAL[user.role] || String(user.role || "").trim().toLowerCase();
    if (Object.values(ROLES).includes(canonical) && canonical !== user.role) {
      await User.updateOne({ _id: user._id }, { $set: { role: canonical } });
      updated += 1;
    }
  }

  return updated;
}
