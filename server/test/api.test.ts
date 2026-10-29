import { DEFAULT_PROFILE } from "@stride/engine";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { openDb } from "../src/db";

const H = { "X-Requested-With": "stride" };
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp({ db: openDb(":memory:"), jwtSecret: "x".repeat(40), rateLimit: false });
});

async function signedIn(email = "jo@example.com") {
  const agent = request.agent(app);
  const r = await agent.post("/api/auth/register").set(H).send({ name: "Jo", email, password: "correct horse" });
  expect(r.status).toBe(201);
  return agent;
}

describe("auth", () => {
  it("registers, sets an httpOnly cookie, and never returns the password hash", async () => {
    const r = await request(app).post("/api/auth/register").set(H).send({ name: "Jo", email: "Jo@Example.com", password: "correct horse" });
    expect(r.status).toBe(201);
    expect(r.headers["set-cookie"][0]).toMatch(/HttpOnly/);
    expect(r.headers["set-cookie"][0]).toMatch(/SameSite=Lax/);
    expect(JSON.stringify(r.body)).not.toMatch(/password|hash/i);
    expect(r.body.user.email).toBe("jo@example.com");
  });

  it("rejects duplicate emails regardless of case", async () => {
    await signedIn("a@b.com");
    const r = await request(app).post("/api/auth/register").set(H).send({ name: "X", email: "A@B.COM", password: "12345678" });
    expect(r.status).toBe(409);
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    await signedIn();
    const a = await request(app).post("/api/auth/login").set(H).send({ email: "jo@example.com", password: "wrong pass" });
    const b = await request(app).post("/api/auth/login").set(H).send({ email: "nobody@example.com", password: "wrong pass" });
    expect(a.status).toBe(401);
    expect(a.body).toEqual(b.body);
  });

  it("requires a session for protected routes and rejects forged tokens", async () => {
    expect((await request(app).get("/api/profile")).status).toBe(401);
    const forged = await request(app).get("/api/profile").set("Cookie", "stride_session=eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.");
    expect(forged.status).toBe(401);
  });

  it("blocks state-changing requests without the CSRF header", async () => {
    const r = await request(app).post("/api/auth/register").send({ name: "Jo", email: "c@d.com", password: "12345678" });
    expect(r.status).toBe(403);
  });

  it("validates input", async () => {
    const r = await request(app).post("/api/auth/register").set(H).send({ name: "Jo", email: "not-an-email", password: "short" });
    expect(r.status).toBe(400);
  });
});

describe("profile and plan", () => {
  it("saves a profile and builds a plan with nutrition", async () => {
    const agent = await signedIn();
    expect((await agent.get("/api/plan")).status).toBe(404);
    const save = await agent.put("/api/profile").set(H).send({ profile: { ...DEFAULT_PROFILE, diet: "vegan" }, units: "imperial" });
    expect(save.status).toBe(200);
    expect(save.body.units).toBe("imperial");
    const plan = await agent.get("/api/plan?variant=2");
    expect(plan.status).toBe(200);
    expect(plan.body.nutrition.macros.protein.grams).toBeGreaterThan(0);
    expect(plan.body.workouts.days).toHaveLength(7);
    expect(plan.body.supplements.find((s: { name: string }) => s.name === "Vitamin B12").relevant).toBe(true);
  });

  it("rejects an invalid profile", async () => {
    const agent = await signedIn();
    const r = await agent.put("/api/profile").set(H).send({ profile: { ...DEFAULT_PROFILE, age: 7 } });
    expect(r.status).toBe(400);
    expect(r.body.field).toBe("profile.age");
  });
});

describe("progress logs", () => {
  it("upserts weights by date and keeps users' data separate", async () => {
    const jo = await signedIn("jo@example.com");
    const sam = await signedIn("sam@example.com");
    await jo.post("/api/weights").set(H).send({ date: "2026-10-01", weightKg: 72 });
    await jo.post("/api/weights").set(H).send({ date: "2026-10-01", weightKg: 71.5 });
    const r = await jo.post("/api/weights").set(H).send({ date: "2026-10-08", weightKg: 71 });
    expect(r.body).toEqual([
      { date: "2026-10-01", weightKg: 71.5 },
      { date: "2026-10-08", weightKg: 71 },
    ]);
    expect((await sam.get("/api/weights")).body).toEqual([]);
    expect((await jo.delete("/api/weights/2026-10-01").set(H)).body).toHaveLength(1);
  });

  it("rejects future dates", async () => {
    const agent = await signedIn();
    const r = await agent.post("/api/weights").set(H).send({ date: "2099-01-01", weightKg: 70 });
    expect(r.status).toBe(400);
  });

  it("logs workouts and deletes everything with the account", async () => {
    const agent = await signedIn();
    await agent.post("/api/workouts").set(H).send({ date: "2026-10-27", title: "Full body A" });
    expect((await agent.get("/api/workouts")).body).toHaveLength(1);
    expect((await agent.delete("/api/account").set(H)).status).toBe(204);
    expect((await agent.get("/api/workouts")).status).toBe(401);
  });
});
