import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL ?? "sqlite.db";
const sqlitePath = dbUrl.replace(/^file:/, "");

if (sqlitePath !== ":memory:") {
  mkdirSync(dirname(sqlitePath), { recursive: true });
}

const globalForDb = global as unknown as {
  conn: Database.Database | undefined;
};

const client =
  globalForDb.conn ??
  new Database(sqlitePath, { timeout: 5000 });

client.pragma("journal_mode = WAL");
client.pragma("foreign_keys = ON");
client.pragma("synchronous = NORMAL");
client.pragma("busy_timeout = 5000");

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = client;
}

export const db = drizzle(client, { schema });
