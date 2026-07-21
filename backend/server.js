import dns from "dns";
import dotenv from "dotenv";
import http from "http";

dns.setDefaultResultOrder("ipv4first");
dotenv.config();

import app, { profileRouteManifest } from "./src/app.js";
import { runBootstrap } from "./src/bootstrap.js";
import { printProfileRoutes } from "./src/utils/assertProfileRoutes.js";

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

if (globalThis.__CRICKET_MATCH_SERVER__) {
  console.error(
    "[FATAL] server.js must only be executed once. Do not import server.js from other modules."
  );
  process.exit(1);
}
globalThis.__CRICKET_MATCH_SERVER__ = { starting: true };

function listenOnce(server, port, host) {
  return new Promise((resolve, reject) => {
    const onListening = () => {
      cleanup();
      resolve();
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      server.off("listening", onListening);
      server.off("error", onError);
    };

    server.once("listening", onListening);
    server.once("error", onError);
    server.listen(port, host);
  });
}

function registerShutdown(server) {
  let shuttingDown = false;

  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${signal} received — closing HTTP server`);
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

async function main() {
  try {
    await runBootstrap();

    const server = http.createServer(app);
    await listenOnce(server, PORT, HOST);

    globalThis.__CRICKET_MATCH_SERVER__ = { server, port: PORT, host: HOST };

    console.log(`Server running on http://${HOST}:${PORT} (pid ${process.pid})`);
    printProfileRoutes(profileRouteManifest);
    console.log("Verify: GET /api/health must include profile.routes");
    console.log(
      "         GET /api/profile must return 401 (no auth) or 200 (auth) — never 404\n"
    );

    registerShutdown(server);
  } catch (err) {
    if (err?.code === "EADDRINUSE") {
      console.error(`\n[FATAL] Port ${PORT} is already in use by another process.`);
      console.error("Stop the existing server (Ctrl+C in that terminal), then run: node server.js\n");
      process.exit(1);
    }

    console.error("Failed to start server:");
    console.error(err);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

main();
