import { defineConfig } from "drizzle-kit";
import { readFileSync } from "fs";

try {
  const env = readFileSync(".env", "utf8");
  const match = env.match(/^DATABASE_URL=(.+)$/m);
  if (match && match[1]) {
    process.env.DATABASE_URL = match[1].trim();
  }
} catch {
  // ignore
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "sqlite.db",
  },
});
