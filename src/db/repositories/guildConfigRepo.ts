import { eq, and } from "drizzle-orm";
import { db } from "../index";
import { guildConfig, logChannels, type GuildConfig } from "../schema";

function now() {
  return Date.now();
}

export async function getOrCreateGuildConfig(guildId: string): Promise<GuildConfig> {
  const existing = await db.select().from(guildConfig).where(eq(guildConfig.guildId, guildId)).get();
  if (existing) return existing;

  const timestamp = now();
  await db.insert(guildConfig).values({ guildId, createdAt: timestamp, updatedAt: timestamp }).run();

  return (await db.select().from(guildConfig).where(eq(guildConfig.guildId, guildId)).get())!;
}

export async function updateGuildConfig(guildId: string, patch: Partial<GuildConfig>) {
  await getOrCreateGuildConfig(guildId);
  await db
    .update(guildConfig)
    .set({ ...patch, updatedAt: now() })
    .where(eq(guildConfig.guildId, guildId))
    .run();
}

export type LogType = "member" | "moderation" | "message";

export async function setLogChannel(guildId: string, logType: LogType, channelId: string) {
  const existing = await db
    .select()
    .from(logChannels)
    .where(and(eq(logChannels.guildId, guildId), eq(logChannels.logType, logType)))
    .get();

  if (existing) {
    await db
      .update(logChannels)
      .set({ channelId })
      .where(and(eq(logChannels.guildId, guildId), eq(logChannels.logType, logType)))
      .run();
  } else {
    await db.insert(logChannels).values({ guildId, logType, channelId }).run();
  }
}

export async function getLogChannel(guildId: string, logType: LogType): Promise<string | undefined> {
  const row = await db
    .select()
    .from(logChannels)
    .where(and(eq(logChannels.guildId, guildId), eq(logChannels.logType, logType)))
    .get();
  return row?.channelId;
}

export async function getAllLogChannels(guildId: string) {
  return db.select().from(logChannels).where(eq(logChannels.guildId, guildId)).all();
}
