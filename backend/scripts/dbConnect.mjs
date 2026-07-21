import mongoose from "mongoose";

/** Same database name as backend/src/config/db.js — scripts must not use the URI default (`test`). */
export function getDbName() {
  return process.env.MONGODB_DATABASE || "cricket_tournament";
}

export async function connectScriptDb() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  const dbName = getDbName();
  await mongoose.connect(uri, { dbName });
  return dbName;
}
