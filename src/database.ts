import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";

const DATA_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "data"
);

export const CUSTOMERS_DB = path.join(DATA_DIR, "customers.db");
export const MOVIES_DB = path.join(DATA_DIR, "movies.db");
export const LOGS_DB = path.join(DATA_DIR, "logs.db");

export function openDatabase(filePath: string): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filePath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

export function closeDatabase(db: sqlite3.Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.close((err) => (err ? reject(err) : resolve()));
  });
}

export function queryAll<T>(
  db: sqlite3.Database,
  sql: string,
  params: (string | number)[] = []
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export function query(
  db: sqlite3.Database,
  sql: string,
  params: (string | number)[] = []
): Promise<sqlite3.RunResult & { lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err: Error | null, result: sqlite3.RunResult & { lastID: number; changes: number }) => (err ? reject(err) : resolve(result)));
  });
}

export async function withDatabase<T>(
  filePath: string,
  fn: (db: sqlite3.Database) => Promise<T>
): Promise<T> {
  const db = await openDatabase(filePath);
  try {
    return await fn(db);
  } finally {
    await closeDatabase(db);
  }
}
