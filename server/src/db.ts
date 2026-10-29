// Uses Node's built-in SQLite module (Node 22.13+), so there is no native package to compile.
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

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
  `);
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
