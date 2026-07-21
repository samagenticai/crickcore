import dns from "dns";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import serverless from "serverless-http";

// Vercel/Lambda: prefer IPv4 for MongoDB Atlas (avoids 30s IPv6 DNS hangs).
dns.setDefaultResultOrder("ipv4first");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });

let serverlessHandler = null;

function sendJson(res, statusCode, body) {
  if (res.headersSent || res.writableEnded) return;
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  const url = (req.url || "/").split("?")[0];
  console.log(`[api] entry ${req.method} ${url}`);

  try {
    if (!serverlessHandler) {
      const t0 = Date.now();
      console.log("[api] loading Express app…");
      const { default: app } = await import("../backend/src/app.js");
      serverlessHandler = serverless(app, {
        binary: ["image/*", "multipart/form-data"],
      });
      console.log(`[api] Express app ready in ${Date.now() - t0}ms`);
    }

    return await serverlessHandler(req, res);
  } catch (err) {
    console.error("[api] Unhandled serverless error:", err);
    sendJson(res, 500, {
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
