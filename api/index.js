import serverless from "serverless-http";
import dotenv from "dotenv";
import app from "../backend/src/app.js";

dotenv.config();

const serverlessHandler = serverless(app, {
  binary: ["image/*", "multipart/form-data"],
});

function sendJson(res, statusCode, body) {
  if (res.headersSent || res.writableEnded) return;
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  try {
    return await serverlessHandler(req, res);
  } catch (err) {
    console.error("[api] Unhandled serverless error:", err);
    sendJson(res, 500, {
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
