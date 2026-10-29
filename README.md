# Stride — health & fitness planner

**Live demo:** https://jody2905.github.io/stride-health-planner/ (guest mode: your data stays in your browser)

A full-stack TypeScript app that builds a personalised plan from a user's age, height, weight, goal weight, activity level and preferences:

- **Calorie, protein and water targets** (Mifflin-St Jeor BMR × activity factor, safe deficit/surplus with hard floors)
- **Weekly workout plan** for 2–6 days, matched to experience level and equipment (none / dumbbells / gym), with how-to steps for every exercise
- **Injury-aware training**: mark knees, lower back, shoulders, wrists, hips or ankles and exercises that load them are replaced with safer alternatives; swap out any exercise you don't want with one tap; low-impact cardio option
- **Nutrition**: macro split, meal-by-meal targets in hand portions, sample days for omnivore / vegetarian / vegan diets, dairy-free and gluten-free filters, and a Caribbean food option
- **Weekly meal plan & grocery list**: seven days of meals scaled to your calories, totalled into a shopping list grouped by aisle, with tick-off and copy
- **Vitamins & supplements** graded Strong / Moderate / Limited / Avoid, filtered to the user's profile, each linked to its research source
- **Daily health targets** (sleep, steps, fibre, sugar, salt) and screening reminders
- **Progress tracking**: weight log with a trend chart against the goal, and workout check-offs
- **Walking with friends**: daily step log against your goal, private friend codes, friend requests, and a weekly leaderboard that only accepted friends can see

Safety rules are built into the engine: no weight-loss plan for under-18s, pregnancy/breastfeeding, or anyone already underweight; goals below a healthy BMI are raised to the bottom of the healthy range; calories never drop below 1,200 (female) / 1,500 (male).

## Stack

| Layer | Tech |
|---|---|
| Health engine | Pure TypeScript package (`packages/engine`), Zod schema, Vitest |
| API | Node + Express, PostgreSQL (Neon in production, PGlite locally: a real Postgres that runs inside Node, nothing to install), JWT sessions in httpOnly cookies |
| Client | React 18 + Vite |
| Tests | 24 engine unit tests, 16 API integration tests (Supertest) |

```
packages/engine   calculations, workouts, nutrition, groceries, supplements, habits (shared by API and client)
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
NODE_ENV=production JWT_SECRET=$(openssl rand -hex 32) DATABASE_URL=postgres://... npm start   # http://localhost:3001
```

| Env var | Default | Notes |
|---|---|---|
| `JWT_SECRET` | random in dev | **Required** in production, 32+ characters |
| `DATABASE_URL` | none | Postgres connection string. **Required in production.** When unset (local dev), a built-in database is stored in `server/stride-data` |
| `DB_PATH` | `server/stride-data` | Folder for the local built-in database |
| `PG_POOL_MAX` | `5` | Max Postgres connections |
| `PORT` | `3001` | |

`npm run build:demo` produces `demo/index.html`, a single self-contained file of the client in guest-only mode (no backend), handy for a static demo.

## Deploy for free (Render + Neon)

The app runs as one web service: Express serves both the API and the built React app.

1. **Database:** create a free project at [neon.com](https://neon.com) and copy its connection string (`postgresql://…?sslmode=require`). Tables are created automatically on first start.
2. **Web service:** on [render.com](https://render.com), choose **New → Blueprint**, pick this repo, and paste the Neon connection string as `DATABASE_URL` when asked. `render.yaml` sets everything else (free plan, build and start commands, Node 22, a generated `JWT_SECRET`).
3. Open the `onrender.com` URL. Free Render services sleep after 15 minutes without visitors and take about a minute to wake up; data is safe in Neon.

GitHub Pages also hosts a guest-only build (see `.github/workflows/pages.yml`).

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
| GET / POST | `/api/steps` | `{date, steps}`, one entry per date |
| DELETE | `/api/steps/:date` | |
| GET | `/api/friends` | Your friend code, friends, and incoming/outgoing requests |
| POST | `/api/friends` | `{code}` sends a request (or accepts theirs if they already asked you) |
| POST | `/api/friends/:id/accept` | |
| DELETE | `/api/friends/:id` | Remove a friend, decline or cancel a request |
| POST | `/api/friends/code` | Issue a new friend code |
| GET | `/api/walking/leaderboard?week=YYYY-MM-DD` | You and your accepted friends' steps for the week starting that Monday |
| GET | `/api/export` | Download all of the user's data as JSON |
| DELETE | `/api/account` | Deletes the user and all their data |

## Security

- Passwords hashed with bcrypt (cost 12); login returns the same error and takes the same time whether or not the email exists
- Sessions are HS256 JWTs in `httpOnly`, `SameSite=Lax` cookies (`Secure` in production); algorithm pinned on verify
- CSRF defence: required custom header on every state-changing request, and no CORS
- Every input validated with Zod; all SQL uses prepared statements; JSON body capped at 20 KB
- Helmet security headers with a strict Content-Security-Policy
- Rate limits: 20 auth attempts per 15 min, 300 API requests per minute per IP
- Friends are added by random, unguessable codes rather than email, so accounts can't be looked up; friends only ever see each other's name and step counts, and either side can remove the link
- Users can export or permanently delete their data; signed-in data is never left in the browser's localStorage
- The server refuses to start in production without a strong `JWT_SECRET`

## Ideas for next steps

- Email verification and password reset
- Food logging against the macro targets
- Swap button for individual exercises and meals

## Disclaimer

Stride gives general, research-based guidance for healthy adults. It is not medical advice. Sources are listed in the app's Research tab.
