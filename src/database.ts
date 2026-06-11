import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const DATA_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "data"
);

export const CUSTOMERS_DB = path.join(DATA_DIR, "customers.db");
export const MOVIES_DB = path.join(DATA_DIR, "movies.db");
export const LOGS_DB = path.join(DATA_DIR, "logs.db");

export type SqliteDatabase = Database.Database;

export type RunResult = {
  lastID: number;
  changes: number;
};

export function openDatabase(filePath: string): Promise<SqliteDatabase> {
  return Promise.resolve(new Database(filePath));
}

export function closeDatabase(db: SqliteDatabase): Promise<void> {
  db.close();
  return Promise.resolve();
}

export function queryAll<T>(
  db: SqliteDatabase,
  sql: string,
  params: (string | number)[] = []
): Promise<T[]> {
  const rows = db.prepare(sql).all(...params) as T[];
  return Promise.resolve(rows);
}

export function query(
  db: SqliteDatabase,
  sql: string,
  params: (string | number)[] = []
): Promise<RunResult> {
  const result = db.prepare(sql).run(...params);
  return Promise.resolve({
    lastID: Number(result.lastInsertRowid),
    changes: result.changes,
  });
}

export async function withDatabase<T>(
  filePath: string,
  fn: (db: SqliteDatabase) => Promise<T>
): Promise<T> {
  const db = await openDatabase(filePath);
  try {
    return await fn(db);
  } finally {
    await closeDatabase(db);
  }
}
