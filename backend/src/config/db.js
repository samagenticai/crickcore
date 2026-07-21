import dotenv from "dotenv";

dotenv.config();

import dns from "dns";
import mongoose from "mongoose";

// Prefer IPv4 for Atlas on Vercel/serverless (prevents long IPv6 resolution hangs).
dns.setDefaultResultOrder("ipv4first");

const isServerless =
  Boolean(process.env.VERCEL) ||
  Boolean(process.env.VERCEL_URL) ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

const DEFAULT_OPTIONS = {
  maxPoolSize: isServerless ? 5 : 10,
  minPoolSize: isServerless ? 0 : 1,
  family: 4,
  serverSelectionTimeoutMS: 8_000,
  socketTimeoutMS: 20_000,
  connectTimeoutMS: 8_000,
  heartbeatFrequencyMS: 10_000,
  retryWrites: true,
  retryReads: true,
};

mongoose.set("bufferCommands", false);
mongoose.set("strictQuery", true);

let listenersRegistered = false;
let connectPromise = null;

function registerConnectionListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on("disconnected", () => {
    connectPromise = null;
    console.warn("[MongoDB] disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[MongoDB] reconnected");
  });

  mongoose.connection.on("error", (err) => {
    connectPromise = null;
    console.error("[MongoDB] connection error:", err.message);
  });
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectPromise) {
    await connectPromise;
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    connectPromise = null;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE || "cricket_tournament";

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  registerConnectionListeners();

  console.log("[MongoDB] connecting…");

  connectPromise = withTimeout(
    mongoose.connect(uri, {
      ...DEFAULT_OPTIONS,
      dbName,
    }),
    DEFAULT_OPTIONS.connectTimeoutMS + 2_000,
    "MongoDB connect"
  );

  try {
    await connectPromise;
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (err) {
    connectPromise = null;
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
    throw err;
  }
};

export async function pingDatabase() {
  if (mongoose.connection.readyState !== 1) {
    return { ok: false, state: mongoose.connection.readyState };
  }

  const started = Date.now();
  await withTimeout(
    mongoose.connection.db.admin().ping(),
    3_000,
    "MongoDB ping"
  );
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
