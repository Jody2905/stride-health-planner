// Uses Node's built-in SQLite module (Node 22.13+), so there is no native package to compile.
import crypto from "node:crypto";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I to avoid mix-ups

/** Random, unguessable friend code like "K7QM-X2PD" (32^8 ≈ 1 trillion combinations). */
export function newFriendCode(): string {
  const bytes = crypto.randomBytes(8);
  const chars = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

/** A prepared statement with typed parameters and rows. */
export interface Statement<Args extends SQLInputValue[], Row> {
  get(...args: Args): Row | undefined;
  all(...args: Args): Row[];
  run(...args: Args): { changes: number | bigint; lastInsertRowid: number | bigint };
}

export interface DB {
  prepare<Args extends SQLInputValue[] = SQLInputValue[], Row = unknown>(sql: string): Statement<Args, Row>;
  close(): void;
}

/** Opens (or creates) the database and applies the schema. All queries elsewhere use prepared statements. */
export function openDb(path: string): DB {
  const db = new DatabaseSync(path);
  if (path !== ":memory:") db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      name          TEXT    NOT NULL,
      password_hash TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS profiles (
      user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data       TEXT    NOT NULL,
      units      TEXT    NOT NULL DEFAULT 'metric',
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS weight_logs (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date      TEXT    NOT NULL,
      weight_kg REAL    NOT NULL,
      UNIQUE (user_id, date)
    );
    CREATE TABLE IF NOT EXISTS workout_logs (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date    TEXT    NOT NULL,
      title   TEXT    NOT NULL,
      UNIQUE (user_id, date)
    );
    CREATE TABLE IF NOT EXISTS step_logs (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date    TEXT    NOT NULL,
      steps   INTEGER NOT NULL,
      UNIQUE (user_id, date)
    );
    -- One row per pair of users. requester sent the request; status becomes 'accepted' when the other accepts.
    CREATE TABLE IF NOT EXISTS friendships (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status       TEXT    NOT NULL CHECK (status IN ('pending', 'accepted')),
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      CHECK (requester_id <> addressee_id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_pair
      ON friendships (min(requester_id, addressee_id), max(requester_id, addressee_id));
  `);

  // Migration: friend codes for accounts created before the walking tracker existed.
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "friend_code")) db.exec("ALTER TABLE users ADD COLUMN friend_code TEXT;");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_friend_code ON users (friend_code);");
  const missing = db.prepare("SELECT id FROM users WHERE friend_code IS NULL").all() as { id: number }[];
  const setCode = db.prepare("UPDATE users SET friend_code = ? WHERE id = ?");
  for (const u of missing) setCode.run(newFriendCode(), u.id);

  return {
    // Rows come back as plain objects so they serialise and compare like normal JSON.
    prepare<Args extends SQLInputValue[], Row>(sql: string): Statement<Args, Row> {
      const s = db.prepare(sql);
      return {
        get: (...args) => {
          const r = s.get(...args);
          return r ? ({ ...r } as Row) : undefined;
        },
        all: (...args) => s.all(...args).map((r) => ({ ...r }) as Row),
        run: (...args) => s.run(...args),
      };
    },
    close: () => db.close(),
  };
}
