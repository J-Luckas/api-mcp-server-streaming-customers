import { CUSTOMERS_DB, queryAll, withDatabase } from "./database.js";

export type CustomerData = {
  name: string;
  email: string;
  document: string;
  lastLogin: string | null;
};

export async function getCustomersData(
  filters?: {
    customerIdList?: number[];
    name?: string;
    email?: string;
    document?: string;
    lastLoginMin?: Date;
    lastLoginMax?: Date;
  },
  fields?: string[]
): Promise<{
  id?: number;
  name?: string;
  email?: string;
  document?: string;
  lastLogin?: string | null;
}[]> {
  return withDatabase(CUSTOMERS_DB, (db) => {
    const { customerIdList, name, email, document, lastLoginMin, lastLoginMax } = filters || {};
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (customerIdList && customerIdList.length > 0) {
      const placeholders = customerIdList.map(() => "?").join(", ");
      conditions.push(`id IN (${placeholders})`);
      params.push(...customerIdList);
    }

    if (name) {
      conditions.push("name LIKE ?");
      params.push(`%${name}%`);
    }

    if (email) {
      conditions.push("email LIKE ?");
      params.push(`%${email}%`);
    }

    if (document) {
      conditions.push("document LIKE ?");
      params.push(`%${document}%`);
    }

    if (lastLoginMin) {
      conditions.push("lastLogin >= ?");
      params.push(lastLoginMin.toISOString());
    }

    if (lastLoginMax) {
      conditions.push("lastLogin <= ?");
      params.push(lastLoginMax.toISOString());
    }

    let sql = `SELECT ${fields?.join(", ") || "id, name, email, document, lastLogin"} FROM customers`;
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    return queryAll<{
      id?: number;
      name?: string;
      email?: string;
      document?: string;
      lastLogin?: string | null;
    }>(db, sql, params);
  });
}
