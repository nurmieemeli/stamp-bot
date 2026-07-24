import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${process.env.DATABASE_PATH ?? "./data/bot.sqlite"}`,
  },
} satisfies Config;
