# Stride — health & fitness planner

**Live demo:** https://jody2905.github.io/stride-health-planner/ (guest mode: your data stays in your browser)

A full-stack TypeScript app that builds a personalised plan from a user's age, height, weight, goal weight, activity level and preferences:

- **Calorie, protein and water targets** (Mifflin-St Jeor BMR × activity factor, safe deficit/surplus with hard floors)
- **Weekly workout plan** for 2–6 days, matched to experience level and equipment (none / dumbbells / gym), with how-to steps for every exercise
- **Nutrition**: macro split, meal-by-meal targets in hand portions, sample days for omnivore / vegetarian / vegan diets, dairy-free and gluten-free filters, and a Caribbean food option
- **Vitamins & supplements** graded Strong / Moderate / Limited / Avoid, filtered to the user's profile, each linked to its research source
- **Daily health targets** (sleep, steps, fibre, sugar, salt) and screening reminders
- **Progress tracking**: weight log with a trend chart against the goal, and workout check-offs

Safety rules are built into the engine: no weight-loss plan for under-18s, pregnancy/breastfeeding, or anyone already underweight; goals below a healthy BMI are raised to the bottom of the healthy range; calories never drop below 1,200 (female) / 1,500 (male).

## Stack

| Layer | Tech |
|---|---|
| Health engine | Pure TypeScript package (`packages/engine`), Zod schema, Vitest |
| API | Node + Express, SQLite (Node's built-in `node:sqlite`, nothing to compile), JWT sessions in httpOnly cookies |
| Client | React 18 + Vite |
| Tests | 17 engine unit tests, 11 API integration tests (Supertest) |

```
packages/engine   calculations, workouts, nutrition, supplements, habits (shared by API and client)
server            Express API + SQLite; also serves the built client in production
client            React app (works as a guest with browser storage, or signed in)
scripts           build helper for the single-file demo
```

The engine is a pure function (`buildPlan(profile)`), so the client computes plans instantly as the user types, and the API exposes the same plan at `GET /api/plan` for other consumers.

## Run it locally

Requires Node 22.13 or newer (Node 24 LTS recommended).

```bash
npm install
npm run dev          # API on :3001, React on http://localhost:5173 (proxied)
npm test             # engine + API tests
npm run typecheck
```

Production:

```bash
npm run build
NODE_ENV=production JWT_SECRET=$(openssl rand -hex 32) npm start   # http://localhost:3001
```

| Env var | Default | Notes |
|---|---|---|
| `JWT_SECRET` | random in dev | **Required** in production, 32+ characters |
| `DB_PATH` | `server/stride.db` | SQLite file location |
| `PORT` | `3001` | |

`npm run build:demo` produces `demo/index.html`, a single self-contained file of the client in guest-only mode (no backend), handy for a static demo.

## API

All mutating requests must send `X-Requested-With: stride` and JSON.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | `{name, email, password}` → creates account, sets session cookie |
| POST | `/api/auth/login` | `{email, password}` |
| POST | `/api/auth/logout` | |
| GET | `/api/auth/me` | Current user + saved profile |
| GET / PUT | `/api/profile` | `{profile, units}` |
| GET | `/api/plan?variant=n` | Full plan for the saved profile (`variant` rotates meal ideas) |
| GET / POST | `/api/weights` | `{date, weightKg}`, one entry per date (upsert) |
| DELETE | `/api/weights/:date` | |
| GET / POST | `/api/workouts` | `{date, title}` |
| DELETE | `/api/workouts/:date` | |
| GET | `/api/export` | Download all of the user's data as JSON |
| DELETE | `/api/account` | Deletes the user and all their data |

## Security

- Passwords hashed with bcrypt (cost 12); login returns the same error and takes the same time whether or not the email exists
- Sessions are HS256 JWTs in `httpOnly`, `SameSite=Lax` cookies (`Secure` in production); algorithm pinned on verify
- CSRF defence: required custom header on every state-changing request, and no CORS
- Every input validated with Zod; all SQL uses prepared statements; JSON body capped at 20 KB
- Helmet security headers with a strict Content-Security-Policy
- Rate limits: 20 auth attempts per 15 min, 300 API requests per minute per IP
- Users can export or permanently delete their data; signed-in data is never left in the browser's localStorage
- The server refuses to start in production without a strong `JWT_SECRET`

## Ideas for next steps

- Email verification and password reset
- Food logging against the macro targets
- Swap button for individual exercises and meals
- Deploy: one service on Render / Railway / Fly.io with a persistent disk for the SQLite file

## Disclaimer

Stride gives general, research-based guidance for healthy adults. It is not medical advice. Sources are listed in the app's Research tab.
