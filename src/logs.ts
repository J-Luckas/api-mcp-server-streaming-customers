import { LOGS_DB, query, withDatabase } from "./database.js";

export async function saveLog(data: string) {
  return withDatabase(LOGS_DB, (db) => {
    return query(db, "INSERT INTO logs (data) VALUES (?)", [data]);
  });
}