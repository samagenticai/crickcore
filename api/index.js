import dns from "dns";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Must run before any network I/O (module body executes before dynamic import below).
dns.setDefaultResultOrder("ipv4first");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });

let app = null;

function sendJson(res, statusCode, body) {
  if (res.headersSent || res.writableEnded) return;
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

/**
 * Vercel passes native Node.js req/res — NOT AWS Lambda events.
 * serverless-http expects API Gateway events and breaks on Vercel (30s hang → 504).
 * Express app is invoked directly, same as http.createServer(app) in server.js.
 */
export default async function handler(req, res) {
  const url = (req.url || "/").split("?")[0];
  const t0 = Date.now();
  console.log(`[api] entry ${req.method} ${url}`);

  try {
    if (!app) {
      const loadStart = Date.now();
      console.log("[api] loading Express app (dynamic import)…");
      ({ default: app } = await import("../backend/src/app.js"));
      console.log(`[api] Express app loaded in ${Date.now() - loadStart}ms`);
    }

    console.log(`[api] dispatching to Express (+${Date.now() - t0}ms)`);
    app(req, res);
    console.log(`[api] Express handler returned (+${Date.now() - t0}ms)`);
  } catch (err) {
    console.error(`[api] fatal error (+${Date.now() - t0}ms):`, err);
    sendJson(res, 500, {
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
