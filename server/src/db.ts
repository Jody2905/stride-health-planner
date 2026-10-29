// Postgres everywhere:
// - In production, DATABASE_URL points at a hosted Postgres (e.g. Neon's free tier).
// - Locally and in tests, PGlite runs a real Postgres inside Node, so there's nothing to install.
import { PGlite } from "@electric-sql/pglite";
import crypto from "node:crypto";
import pg from "pg";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I to avoid mix-ups

/** Random, unguessable friend code like "K7QM-X2PD" (32^8 ≈ 1 trillion combinations). */
export function newFriendCode(): string {
  const bytes = crypto.randomBytes(8);
  const chars = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

type Param = string | number | boolean | null;

/** A prepared query with typed parameters and rows. */
export interface Statement<Args extends Param[], Row> {
  get(...args: Args): Promise<Row | undefined>;
  all(...args: Args): Promise<Row[]>;
  run(...args: Args): Promise<{ changes: number }>;
}

export interface DB {
  /** SQL uses `?` placeholders; they're converted to Postgres `$1, $2…` here. */
  prepare<Args extends Param[] = Param[], Row = unknown>(sql: string): Statement<Args, Row>;
  close(): Promise<void>;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         TEXT        NOT NULL,
    name          TEXT        NOT NULL,
    password_hash TEXT        NOT NULL,
    friend_code   TEXT        NOT NULL UNIQUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));
  CREATE TABLE IF NOT EXISTS profiles (
    user_id    INTEGER     PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data       JSONB       NOT NULL,
    units      TEXT        NOT NULL DEFAULT 'metric',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS weight_logs (
    id        SERIAL PRIMARY KEY,
    user_id   INTEGER          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date      TEXT             NOT NULL,
    weight_kg DOUBLE PRECISION NOT NULL,
    UNIQUE (user_id, date)
  );
  CREATE TABLE IF NOT EXISTS workout_logs (
    id      SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date    TEXT    NOT NULL,
    title   TEXT    NOT NULL,
    UNIQUE (user_id, date)
  );
  CREATE TABLE IF NOT EXISTS step_logs (
    id      SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date    TEXT    NOT NULL,
    steps   INTEGER NOT NULL,
    UNIQUE (user_id, date)
  );
  -- One row per pair of users. requester sent the request; status becomes 'accepted' when the other accepts.
  CREATE TABLE IF NOT EXISTS friendships (
    id           SERIAL PRIMARY KEY,
    requester_id INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       TEXT        NOT NULL CHECK (status IN ('pending', 'accepted')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (requester_id <> addressee_id)
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_pair
    ON friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));
`;

/** Converts `?` placeholders to `$1, $2…`. Our SQL never contains literal question marks. */
function toPg(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

type Runner = (sql: string, params: Param[]) => Promise<{ rows: unknown[]; rowCount: number }>;

function wrap(runner: Runner, close: () => Promise<void>): DB {
  return {
    prepare<Args extends Param[], Row>(sql: string): Statement<Args, Row> {
      const text = toPg(sql);
      return {
        get: async (...args) => (await runner(text, args)).rows[0] as Row | undefined,
        all: async (...args) => (await runner(text, args)).rows as Row[],
        run: async (...args) => ({ changes: (await runner(text, args)).rowCount }),
      };
    },
    close,
  };
}

/**
 * Opens the database and applies the schema.
 * @param url a postgres:// connection string, a folder path for a local PGlite database, or ":memory:".
 */
export async function openDb(url: string): Promise<DB> {
  if (/^postgres(ql)?:\/\//.test(url)) {
    const pool = new pg.Pool({ connectionString: url, max: Number(process.env.PG_POOL_MAX ?? 5), idleTimeoutMillis: 30_000 });
    await pool.query(SCHEMA);
    return wrap(
      async (sql, params) => {
        const r = await pool.query(sql, params);
        return { rows: r.rows, rowCount: r.rowCount ?? 0 };
      },
      () => pool.end(),
    );
  }
  const lite = url === ":memory:" ? new PGlite() : new PGlite(url);
  await lite.exec(SCHEMA);
  return wrap(
    async (sql, params) => {
      const r = await lite.query(sql, params);
      return { rows: r.rows, rowCount: r.affectedRows ?? 0 };
    },
    () => lite.close(),
  );
}
