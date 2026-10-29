import { buildPlan, ProfileSchema, type Profile } from "@stride/engine";
import cookieParser from "cookie-parser";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { checkPassword, DUMMY_HASH, hashPassword, makeAuth, type AuthedRequest } from "./auth";
import type { DB } from "./db";

export interface AppOptions {
  db: DB;
  jwtSecret: string;
  secureCookies?: boolean;
  /** Folder with the built React app; served when present. */
  clientDist?: string;
  /** Disable rate limits in tests. */
  rateLimit?: boolean;
}

const Email = z.string().trim().toLowerCase().email().max(254);
const RegisterBody = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email: Email,
  password: z.string().min(8, "Use at least 8 characters.").max(128),
});
const LoginBody = z.object({ email: Email, password: z.string().min(1).max(128) });
const Units = z.enum(["metric", "imperial"]);
const ProfileBody = z.object({ profile: ProfileSchema, units: Units.default("metric") });
const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD.")
  .refine((d) => !Number.isNaN(Date.parse(d)), "That date doesn't exist.")
  .refine((d) => Date.parse(d) <= Date.now() + 36e5 * 24, "Date can't be in the future.");
const WeightBody = z.object({ date: IsoDate, weightKg: z.number().min(30).max(300) });
const WorkoutBody = z.object({ date: IsoDate, title: z.string().trim().min(1).max(60) });

/** Wraps async handlers so thrown errors reach the error middleware. */
const h =
  (fn: (req: AuthedRequest, res: Response) => unknown) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req as AuthedRequest, res)).catch(next);

export function createApp(opts: AppOptions) {
  const { db } = opts;
  const auth = makeAuth(opts.jwtSecret, opts.secureCookies ?? false);
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com"],
          "img-src": ["'self'", "data:"],
        },
      },
    }),
  );
  app.use(express.json({ limit: "20kb" }));
  app.use(cookieParser());

  // CSRF defence: state-changing API calls must carry a custom header. Browsers won't send it
  // cross-site without a CORS preflight, and this API never grants CORS.
  app.use("/api", (req, res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.get("X-Requested-With") !== "stride") {
      return res.status(403).json({ error: "Missing request header." });
    }
    next();
  });

  if (opts.rateLimit !== false) {
    app.use("/api/auth/", rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Too many attempts. Try again in 15 minutes." } }));
    app.use("/api/", rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));
  }

  /* ---------------- statements ---------------- */
  const q = {
    userByEmail: db.prepare<[string], { id: number; name: string; email: string; password_hash: string }>("SELECT * FROM users WHERE email = ?"),
    userById: db.prepare<[number], { id: number; name: string; email: string; created_at: string }>("SELECT id, name, email, created_at FROM users WHERE id = ?"),
    insertUser: db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)"),
    deleteUser: db.prepare("DELETE FROM users WHERE id = ?"),
    profile: db.prepare<[number], { data: string; units: string; updated_at: string }>("SELECT data, units, updated_at FROM profiles WHERE user_id = ?"),
    upsertProfile: db.prepare(
      `INSERT INTO profiles (user_id, data, units) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, units = excluded.units, updated_at = datetime('now')`,
    ),
    weights: db.prepare<[number], { date: string; weightKg: number }>("SELECT date, weight_kg AS weightKg FROM weight_logs WHERE user_id = ? ORDER BY date"),
    upsertWeight: db.prepare(
      `INSERT INTO weight_logs (user_id, date, weight_kg) VALUES (?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET weight_kg = excluded.weight_kg`,
    ),
    deleteWeight: db.prepare("DELETE FROM weight_logs WHERE user_id = ? AND date = ?"),
    workouts: db.prepare<[number], { date: string; title: string }>("SELECT date, title FROM workout_logs WHERE user_id = ? ORDER BY date"),
    upsertWorkout: db.prepare(
      `INSERT INTO workout_logs (user_id, date, title) VALUES (?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET title = excluded.title`,
    ),
    deleteWorkout: db.prepare("DELETE FROM workout_logs WHERE user_id = ? AND date = ?"),
  };

  const getProfile = (userId: number) => {
    const row = q.profile.get(userId);
    if (!row) return null;
    const parsed = ProfileSchema.safeParse(JSON.parse(row.data));
    return parsed.success ? { profile: parsed.data, units: row.units as "metric" | "imperial", updatedAt: row.updated_at } : null;
  };

  /* ---------------- routes ---------------- */
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.post(
    "/api/auth/register",
    h(async (req, res) => {
      const body = RegisterBody.parse(req.body);
      if (q.userByEmail.get(body.email)) return res.status(409).json({ error: "An account with that email already exists. Sign in instead." });
      const info = q.insertUser.run(body.name, body.email, await hashPassword(body.password));
      const id = Number(info.lastInsertRowid);
      auth.issue(res, id);
      res.status(201).json({ user: q.userById.get(id) });
    }),
  );

  app.post(
    "/api/auth/login",
    h(async (req, res) => {
      const body = LoginBody.parse(req.body);
      const user = q.userByEmail.get(body.email);
      const ok = await checkPassword(body.password, user?.password_hash ?? DUMMY_HASH);
      if (!user || !ok) return res.status(401).json({ error: "Email or password is incorrect." });
      auth.issue(res, user.id);
      res.json({ user: q.userById.get(user.id) });
    }),
  );

  app.post("/api/auth/logout", (_req, res) => {
    auth.clear(res);
    res.status(204).end();
  });

  app.get(
    "/api/auth/me",
    auth.requireUser,
    h((req, res) => {
      const user = q.userById.get(req.userId!);
      if (!user) {
        auth.clear(res);
        return res.status(401).json({ error: "Sign in to continue." });
      }
      res.json({ user, ...(getProfile(user.id) ?? { profile: null, units: "metric" }) });
    }),
  );

  app.delete(
    "/api/account",
    auth.requireUser,
    h((req, res) => {
      q.deleteUser.run(req.userId!); // cascades to profile and logs
      auth.clear(res);
      res.status(204).end();
    }),
  );

  app.get(
    "/api/profile",
    auth.requireUser,
    h((req, res) => {
      const p = getProfile(req.userId!);
      if (!p) return res.status(404).json({ error: "No profile saved yet." });
      res.json(p);
    }),
  );

  app.put(
    "/api/profile",
    auth.requireUser,
    h((req, res) => {
      const body = ProfileBody.parse(req.body);
      q.upsertProfile.run(req.userId!, JSON.stringify(body.profile), body.units);
      res.json(getProfile(req.userId!));
    }),
  );

  app.get(
    "/api/plan",
    auth.requireUser,
    h((req, res) => {
      const p = getProfile(req.userId!);
      if (!p) return res.status(404).json({ error: "Save your profile first." });
      const variant = z.coerce.number().int().min(0).max(1000).catch(0).parse(req.query.variant);
      res.json(buildPlan(p.profile as Profile, { units: p.units, mealVariant: variant }));
    }),
  );

  app.get("/api/weights", auth.requireUser, h((req, res) => res.json(q.weights.all(req.userId!))));
  app.post(
    "/api/weights",
    auth.requireUser,
    h((req, res) => {
      const b = WeightBody.parse(req.body);
      q.upsertWeight.run(req.userId!, b.date, b.weightKg);
      res.status(201).json(q.weights.all(req.userId!));
    }),
  );
  app.delete(
    "/api/weights/:date",
    auth.requireUser,
    h((req, res) => {
      q.deleteWeight.run(req.userId!, IsoDate.parse(req.params.date));
      res.json(q.weights.all(req.userId!));
    }),
  );

  app.get("/api/workouts", auth.requireUser, h((req, res) => res.json(q.workouts.all(req.userId!))));
  app.post(
    "/api/workouts",
    auth.requireUser,
    h((req, res) => {
      const b = WorkoutBody.parse(req.body);
      q.upsertWorkout.run(req.userId!, b.date, b.title);
      res.status(201).json(q.workouts.all(req.userId!));
    }),
  );
  app.delete(
    "/api/workouts/:date",
    auth.requireUser,
    h((req, res) => {
      q.deleteWorkout.run(req.userId!, IsoDate.parse(req.params.date));
      res.json(q.workouts.all(req.userId!));
    }),
  );

  /** Lets users download everything stored about them. */
  app.get(
    "/api/export",
    auth.requireUser,
    h((req, res) => {
      const id = req.userId!;
      res.setHeader("Content-Disposition", 'attachment; filename="stride-data.json"');
      res.json({ user: q.userById.get(id), ...getProfile(id), weights: q.weights.all(id), workouts: q.workouts.all(id) });
    }),
  );

  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

  /* ---------------- static client ---------------- */
  if (opts.clientDist && fs.existsSync(path.join(opts.clientDist, "index.html"))) {
    app.use(express.static(opts.clientDist, { index: false, maxAge: "1h" }));
    app.get("*", (_req, res) => res.sendFile(path.join(opts.clientDist!, "index.html")));
  }

  /* ---------------- errors ---------------- */
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return res.status(400).json({ error: first?.message ?? "Invalid input.", field: first?.path.join(".") });
    }
    if (err instanceof SyntaxError) return res.status(400).json({ error: "Request body isn't valid JSON." });
    console.error(err);
    res.status(500).json({ error: "Something went wrong on our side. Try again." });
  });

  return app;
}
