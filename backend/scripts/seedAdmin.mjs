/**
 * Create or sync the initial Admin account (manual / developer use only).
 *
 * Required in backend/.env:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE
 * Optional:
 *   ADMIN_FULL_NAME (default: "Platform Admin")
 *
 * Run from backend/: npm run seed:admin
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const envPath = path.resolve(backendRoot, ".env");

const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.error(`Failed to load .env from ${envPath}:`, envResult.error.message);
  process.exit(1);
}

const { default: User } = await import("../src/models/User.js");
const { default: Settings } = await import("../src/models/Settings.js");
const { ROLES } = await import("../src/constants/roles.js");
const { connectScriptDb } = await import("./dbConnect.mjs");

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || "");
const phone = String(process.env.ADMIN_PHONE || "").trim();
const fullName = String(process.env.ADMIN_FULL_NAME || "Platform Admin").trim();

const missing = [];
if (!uri) missing.push("MONGODB_URI");
if (!email) missing.push("ADMIN_EMAIL");
if (!password) missing.push("ADMIN_PASSWORD");
if (!phone) missing.push("ADMIN_PHONE");

if (missing.length > 0) {
  console.error(`Missing required environment variables in ${envPath}:`);
  missing.forEach((key) => console.error(`  - ${key}`));
  console.error("\nAdd the Admin variables (see backend/.env.example) and run again.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters");
  process.exit(1);
}

try {
  const dbName = await connectScriptDb();
  console.log(`Connected to MongoDB (${dbName})`);

  const existingAdmin = await User.findOne({ role: ROLES.ADMIN });

  if (existingAdmin) {
    existingAdmin.fullName = fullName;
    existingAdmin.password = password;

    const phoneOwner = await User.findOne({ phone, _id: { $ne: existingAdmin._id } });
    if (phoneOwner) {
      console.error(
        `ADMIN_PHONE is already used by another account (${phoneOwner.email}). Choose a unique phone.`
      );
      process.exit(1);
    }

    existingAdmin.phone = phone;
    await existingAdmin.save();

    console.log("Admin account already exists — credentials synced from backend/.env");
    console.log(`  Email: ${existingAdmin.email}`);
    console.log("  Password updated from ADMIN_PASSWORD");
    process.exit(0);
  }

  const duplicate = await User.findOne({ $or: [{ email }, { phone }] });
  if (duplicate) {
    console.error(
      `Cannot create admin: ${duplicate.email === email ? "email" : "phone"} already used by another account.`
    );
    process.exit(1);
  }

  const baseUsername = (email.split("@")[0] || "platformadmin").replace(/[^\w.-]/g, "").slice(0, 24);
  let username = baseUsername || "platformadmin";
  let suffix = 0;
  while (await User.findOne({ username })) {
    suffix += 1;
    username = `${baseUsername || "platformadmin"}${suffix}`;
  }

  const admin = await User.create({
    fullName,
    username,
    email,
    phone,
    password,
    role: ROLES.ADMIN,
    subscriptionPlan: "free",
    subscriptionStatus: "none",
  });

  await Settings.create({ user: admin._id });

  console.log("Admin account created successfully.");
  console.log(`  Email: ${email}`);
  console.log("  Sign in via the normal Login page — Admin role is assigned server-side only.");
} catch (err) {
  console.error("Admin seed failed:", err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
