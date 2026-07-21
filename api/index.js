import serverless from "serverless-http";
import dotenv from "dotenv";
import app from "../backend/src/app.js";
import { ensureDatabaseReady } from "../backend/src/bootstrap.js";

dotenv.config();

const serverlessHandler = serverless(app, {
  binary: ["image/*", "multipart/form-data"],
});

export default async function handler(req, res) {
  await ensureDatabaseReady();
  return serverlessHandler(req, res);
}
