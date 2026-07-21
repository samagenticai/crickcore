import dotenv from "dotenv";

dotenv.config();

import mongoose from "mongoose";

const DEFAULT_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  connectTimeoutMS: 10_000,
  heartbeatFrequencyMS: 10_000,
  retryWrites: true,
  retryReads: true,
};

let listenersRegistered = false;
let connectPromise = null;

function registerConnectionListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on("disconnected", () => {
    connectPromise = null;
    console.warn("[MongoDB] disconnected — waiting for driver reconnect");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[MongoDB] reconnected");
  });

  mongoose.connection.on("error", (err) => {
    connectPromise = null;
    console.error("[MongoDB] connection error:", err.message);
  });
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectPromise) {
    await connectPromise;
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE || "cricket_tournament";

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  registerConnectionListeners();

  connectPromise = mongoose.connect(uri, {
    ...DEFAULT_OPTIONS,
    dbName,
  });

  try {
    await connectPromise;
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (err) {
    connectPromise = null;
    throw err;
  }
};

export async function pingDatabase() {
  if (mongoose.connection.readyState !== 1) {
    return { ok: false, state: mongoose.connection.readyState };
  }

  const started = Date.now();
  await mongoose.connection.db.admin().ping();
  return { ok: true, latencyMs: Date.now() - started };
}

export function getDatabaseState() {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return {
    readyState: mongoose.connection.readyState,
    label: states[mongoose.connection.readyState] || "unknown",
  };
}

export default connectDB;
