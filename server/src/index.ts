import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app";
import { openDb } from "./db";

const here = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";

let secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) {
  if (isProd) {
    console.error("JWT_SECRET must be set to at least 32 characters in production.");
    process.exit(1);
  }
  secret = crypto.randomBytes(32).toString("hex");
  console.warn("JWT_SECRET not set: using a random dev secret (sessions reset on restart).");
}

const db = openDb(process.env.DB_PATH ?? path.resolve(here, "../stride.db"));
const app = createApp({
  db,
  jwtSecret: secret,
  secureCookies: isProd,
  clientDist: path.resolve(here, "../../client/dist"),
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`Stride API listening on http://localhost:${port}`));
