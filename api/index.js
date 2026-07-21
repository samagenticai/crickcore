import serverless from "serverless-http";
import dotenv from "dotenv";
import app from "../backend/src/app.js";
import { runBootstrap } from "../backend/src/bootstrap.js";

dotenv.config();

let readyPromise = null;

function ensureReady() {
  if (!readyPromise) {
    readyPromise = runBootstrap().catch((err) => {
      readyPromise = null;
      throw err;
    });
  }
  return readyPromise;
}

const serverlessHandler = serverless(app, {
  binary: ["image/*", "multipart/form-data"],
});

export default async function handler(req, res) {
  await ensureReady();
  return serverlessHandler(req, res);
}
