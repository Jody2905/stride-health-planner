import { buildPlan, ProfileSchema, type Profile } from "@stride/engine";
import cookieParser from "cookie-parser";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { checkPassword, DUMMY_HASH, hashPassword, makeAuth, type AuthedRequest } from "./auth";
import { newFriendCode, type DB } from "./db";

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
const StepsBody = z.object({ date: IsoDate, steps: z.number().int().min(0).max(100000) });
const FriendCode = z
  .string()
  .transform((c) => c.toUpperCase().replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^[A-HJ-NP-Z2-9]{8}$/, "Friend codes look like K7QM-X2PD."))
  .transform((c) => `${c.slice(0, 4)}-${c.slice(4)}`);
const UserIdParam = z.coerce.number().int().positive();
const MAX_PENDING = 20;

function weekDates(monday: string): string[] {
  const start = Date.parse(monday + "T00:00:00Z");
  return Array.from({ length: 7 }, (_, i) => new Date(start + i * 864e5).toISOString().slice(0, 10));
}

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
    userByEmail: db.prepare<[string], { id: number; name: string; email: string; password_hash: string }>("SELECT id, name, email, password_hash FROM users WHERE lower(email) = lower(?)"),
    userById: db.prepare<[number], { id: number; name: string; email: string; created_at: string }>("SELECT id, name, email, created_at FROM users WHERE id = ?"),
    insertUser: db.prepare<[string, string, string, string], { id: number }>("INSERT INTO users (name, email, password_hash, friend_code) VALUES (?, ?, ?, ?) RETURNING id"),
    deleteUser: db.prepare("DELETE FROM users WHERE id = ?"),
    profile: db.prepare<[number], { data: unknown; units: string; updated_at: string }>("SELECT data, units, updated_at FROM profiles WHERE user_id = ?"),
    upsertProfile: db.prepare(
      `INSERT INTO profiles (user_id, data, units) VALUES (?, ?::jsonb, ?)
       ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, units = excluded.units, updated_at = now()`,
    ),
    weights: db.prepare<[number], { date: string; weightKg: number }>("SELECT date, weight_kg AS \"weightKg\" FROM weight_logs WHERE user_id = ? ORDER BY date"),
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
    steps: db.prepare<[number], { date: string; steps: number }>("SELECT date, steps FROM step_logs WHERE user_id = ? ORDER BY date"),
    upsertSteps: db.prepare(
      `INSERT INTO step_logs (user_id, date, steps) VALUES (?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET steps = excluded.steps`,
    ),
    deleteSteps: db.prepare("DELETE FROM step_logs WHERE user_id = ? AND date = ?"),
    myCode: db.prepare<[number], { friend_code: string }>("SELECT friend_code FROM users WHERE id = ?"),
    setCode: db.prepare("UPDATE users SET friend_code = ? WHERE id = ?"),
    userByCode: db.prepare<[string], { id: number; name: string }>("SELECT id, name FROM users WHERE friend_code = ?"),
    friendships: db.prepare<[number, number, number], { id: number; name: string; status: string; requester_id: number }>(
      `SELECT u.id, u.name, f.status, f.requester_id
         FROM friendships f
         JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
        WHERE f.requester_id = ? OR f.addressee_id = ?
        ORDER BY u.name`,
    ),
    pair: db.prepare<[number, number, number, number], { requester_id: number; status: string }>(
      "SELECT requester_id, status FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)",
    ),
    pendingOut: db.prepare<[number], { n: number }>("SELECT COUNT(*)::int AS n FROM friendships WHERE requester_id = ? AND status = 'pending'"),
    insertFriend: db.prepare("INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, 'pending')"),
    acceptFriend: db.prepare("UPDATE friendships SET status = 'accepted' WHERE requester_id = ? AND addressee_id = ? AND status = 'pending'"),
    deleteFriend: db.prepare("DELETE FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)"),
    // The signed-in user plus accepted friends, with their steps for the week. Nobody else's data can appear here.
    board: db.prepare<[string, string, number, number, number, number], { id: number; name: string; goal: number | null; date: string | null; steps: number | null }>(
      `SELECT u.id, u.name, (p.data->>'stepGoal')::int AS goal, s.date, s.steps
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         LEFT JOIN step_logs s ON s.user_id = u.id AND s.date BETWEEN ? AND ?
        WHERE u.id = ?
           OR u.id IN (SELECT CASE WHEN requester_id = ? THEN addressee_id ELSE requester_id END
                         FROM friendships
                        WHERE status = 'accepted' AND (requester_id = ? OR addressee_id = ?))`,
    ),
  };

  async function friendsOf(me: number) {
    const rows = await q.friendships.all(me, me, me);
    const pick = (f: (r: (typeof rows)[number]) => boolean) => rows.filter(f).map((r) => ({ id: r.id, name: r.name }));
    return {
      code: (await q.myCode.get(me))?.friend_code ?? "",
      friends: pick((r) => r.status === "accepted"),
      incoming: pick((r) => r.status === "pending" && r.requester_id !== me),
      outgoing: pick((r) => r.status === "pending" && r.requester_id === me),
    };
  }

  const getProfile = async (userId: number) => {
    const row = await q.profile.get(userId);
    if (!row) return null;
    const parsed = ProfileSchema.safeParse(typeof row.data === "string" ? JSON.parse(row.data) : row.data);
    return parsed.success ? { profile: parsed.data, units: row.units as "metric" | "imperial", updatedAt: row.updated_at } : null;
  };

  /* ---------------- routes ---------------- */
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.post(
    "/api/auth/register",
    h(async (req, res) => {
      const body = RegisterBody.parse(req.body);
      if (await q.userByEmail.get(body.email)) return res.status(409).json({ error: "An account with that email already exists. Sign in instead." });
      const inserted = await q.insertUser.get(body.name, body.email, await hashPassword(body.password), newFriendCode());
      const id = inserted!.id;
      auth.issue(res, id);
      res.status(201).json({ user: await q.userById.get(id) });
    }),
  );

  app.post(
    "/api/auth/login",
    h(async (req, res) => {
      const body = LoginBody.parse(req.body);
      const user = await q.userByEmail.get(body.email);
      const ok = await checkPassword(body.password, user?.password_hash ?? DUMMY_HASH);
      if (!user || !ok) return res.status(401).json({ error: "Email or password is incorrect." });
      auth.issue(res, user.id);
      res.json({ user: await q.userById.get(user.id) });
    }),
  );

  app.post("/api/auth/logout", (_req, res) => {
    auth.clear(res);
    res.status(204).end();
  });

  app.get(
    "/api/auth/me",
    auth.requireUser,
    h(async (req, res) => {
      const user = await q.userById.get(req.userId!);
      if (!user) {
        auth.clear(res);
        return res.status(401).json({ error: "Sign in to continue." });
      }
      res.json({ user, ...(await getProfile(user.id) ?? { profile: null, units: "metric" }) });
    }),
  );

  app.delete(
    "/api/account",
    auth.requireUser,
    h(async (req, res) => {
      await q.deleteUser.run(req.userId!); // cascades to profile and logs
      auth.clear(res);
      res.status(204).end();
    }),
  );

  app.get(
    "/api/profile",
    auth.requireUser,
    h(async (req, res) => {
      const p = await getProfile(req.userId!);
      if (!p) return res.status(404).json({ error: "No profile saved yet." });
      res.json(p);
    }),
  );

  app.put(
    "/api/profile",
    auth.requireUser,
    h(async (req, res) => {
      const body = ProfileBody.parse(req.body);
      await q.upsertProfile.run(req.userId!, JSON.stringify(body.profile), body.units);
      res.json(await getProfile(req.userId!));
    }),
  );

  app.get(
    "/api/plan",
    auth.requireUser,
    h(async (req, res) => {
      const p = await getProfile(req.userId!);
      if (!p) return res.status(404).json({ error: "Save your profile first." });
      const variant = z.coerce.number().int().min(0).max(1000).catch(0).parse(req.query.variant);
      res.json(buildPlan(p.profile as Profile, { units: p.units, mealVariant: variant }));
    }),
  );

  app.get("/api/weights", auth.requireUser, h(async (req, res) => res.json(await q.weights.all(req.userId!))));
  app.post(
    "/api/weights",
    auth.requireUser,
    h(async (req, res) => {
      const b = WeightBody.parse(req.body);
      await q.upsertWeight.run(req.userId!, b.date, b.weightKg);
      res.status(201).json(await q.weights.all(req.userId!));
    }),
  );
  app.delete(
    "/api/weights/:date",
    auth.requireUser,
    h(async (req, res) => {
      await q.deleteWeight.run(req.userId!, IsoDate.parse(req.params.date));
      res.json(await q.weights.all(req.userId!));
    }),
  );

  app.get("/api/workouts", auth.requireUser, h(async (req, res) => res.json(await q.workouts.all(req.userId!))));
  app.post(
    "/api/workouts",
    auth.requireUser,
    h(async (req, res) => {
      const b = WorkoutBody.parse(req.body);
      await q.upsertWorkout.run(req.userId!, b.date, b.title);
      res.status(201).json(await q.workouts.all(req.userId!));
    }),
  );
  app.delete(
    "/api/workouts/:date",
    auth.requireUser,
    h(async (req, res) => {
      await q.deleteWorkout.run(req.userId!, IsoDate.parse(req.params.date));
      res.json(await q.workouts.all(req.userId!));
    }),
  );

  /* ---------------- walking tracker ---------------- */
  app.get("/api/steps", auth.requireUser, h(async (req, res) => res.json(await q.steps.all(req.userId!))));
  app.post(
    "/api/steps",
    auth.requireUser,
    h(async (req, res) => {
      const b = StepsBody.parse(req.body);
      await q.upsertSteps.run(req.userId!, b.date, b.steps);
      res.status(201).json(await q.steps.all(req.userId!));
    }),
  );
  app.delete(
    "/api/steps/:date",
    auth.requireUser,
    h(async (req, res) => {
      await q.deleteSteps.run(req.userId!, IsoDate.parse(req.params.date));
      res.json(await q.steps.all(req.userId!));
    }),
  );

  app.get("/api/friends", auth.requireUser, h(async (req, res) => res.json(await friendsOf(req.userId!))));

  app.post(
    "/api/friends",
    auth.requireUser,
    h(async (req, res) => {
      const me = req.userId!;
      const code = FriendCode.parse(req.body?.code);
      const other = await q.userByCode.get(code);
      if (!other) return res.status(404).json({ error: "No one has that friend code. Check it and try again." });
      if (other.id === me) return res.status(400).json({ error: "That's your own code. Share it with a friend instead." });
      const existing = await q.pair.get(me, other.id, other.id, me);
      if (existing?.status === "accepted") return res.status(409).json({ error: `You and ${other.name} are already friends.` });
      if (existing && existing.requester_id === me) return res.status(409).json({ error: `You've already sent ${other.name} a request.` });
      if (existing) {
        // They already asked us: adding their code accepts it.
        await q.acceptFriend.run(other.id, me);
        return res.json({ ...await friendsOf(me), message: `You and ${other.name} are now friends.` });
      }
      if (((await q.pendingOut.get(me))?.n ?? 0) >= MAX_PENDING)
        return res.status(429).json({ error: "You have too many requests waiting. Wait for some to be accepted first." });
      await q.insertFriend.run(me, other.id);
      res.status(201).json({ ...await friendsOf(me), message: `Request sent to ${other.name}.` });
    }),
  );

  app.post(
    "/api/friends/:id/accept",
    auth.requireUser,
    h(async (req, res) => {
      const info = await q.acceptFriend.run(UserIdParam.parse(req.params.id), req.userId!);
      if (!Number(info.changes)) return res.status(404).json({ error: "That request no longer exists." });
      res.json(await friendsOf(req.userId!));
    }),
  );

  /** Removes a friend, declines a request, or cancels one you sent. */
  app.delete(
    "/api/friends/:id",
    auth.requireUser,
    h(async (req, res) => {
      const me = req.userId!;
      const other = UserIdParam.parse(req.params.id);
      await q.deleteFriend.run(me, other, other, me);
      res.json(await friendsOf(me));
    }),
  );

  /** Issues a new friend code; the old one stops working. */
  app.post(
    "/api/friends/code",
    auth.requireUser,
    h(async (req, res) => {
      await q.setCode.run(newFriendCode(), req.userId!);
      res.json(await friendsOf(req.userId!));
    }),
  );

  app.get(
    "/api/walking/leaderboard",
    auth.requireUser,
    h(async (req, res) => {
      const me = req.userId!;
      const week = IsoDate.parse(req.query.week);
      const dates = weekDates(week);
      const rows = await q.board.all(dates[0], dates[6], me, me, me, me);
      const people = new Map<number, { id: number; name: string; isMe: boolean; goal: number; daily: number[]; total: number }>();
      for (const r of rows) {
        const person = people.get(r.id) ?? { id: r.id, name: r.name, isMe: r.id === me, goal: r.goal ?? 8000, daily: Array(7).fill(0), total: 0 };
        if (r.date && r.steps != null) {
          person.daily[dates.indexOf(r.date)] = r.steps;
          person.total += r.steps;
        }
        people.set(r.id, person);
      }
      const members = [...people.values()].sort((a, b) => b.total - a.total);
      res.json({ week: dates, members });
    }),
  );

  /** Lets users download everything stored about them. */
  app.get(
    "/api/export",
    auth.requireUser,
    h(async (req, res) => {
      const id = req.userId!;
      res.setHeader("Content-Disposition", 'attachment; filename="stride-data.json"');
      const { friends } = await friendsOf(id);
      res.json({ user: await q.userById.get(id), ...await getProfile(id), weights: await q.weights.all(id), workouts: await q.workouts.all(id), steps: await q.steps.all(id), friends: friends.map((f) => f.name) });
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
    // Postgres unique violation: two requests raced to create the same email, friendship, etc.
    if ((err as { code?: string }).code === "23505") return res.status(409).json({ error: "That already exists." });
    console.error(err);
    res.status(500).json({ error: "Something went wrong on our side. Try again." });
  });

  return app;
}
