import path from "node:path";
import fs from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { env } from "../config/env";
import * as schema from "./schema";

const dbDir = path.dirname(env.DATABASE_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const client = createClient({ url: `file:${env.DATABASE_PATH}` });

export const db = drizzle(client, { schema });

export async function runMigrations() {
  await migrate(db, { migrationsFolder: path.join(__dirname, "migrations") });
}
