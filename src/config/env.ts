import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
  CLIENT_ID: z.string().min(1, "CLIENT_ID is required"),
  GUILD_ID: z.string().min(1, "GUILD_ID is required"),
  DATABASE_PATH: z.string().default("./data/bot.sqlite"),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
