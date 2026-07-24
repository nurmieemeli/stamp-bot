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
  const timestamp = now();
  await db
    .insert(guildConfig)
    .values({ guildId, ...patch, createdAt: timestamp, updatedAt: timestamp })
    .onConflictDoUpdate({
      target: guildConfig.guildId,
      set: { ...patch, updatedAt: timestamp },
    })
    .run();
}

export type LogType = "member" | "moderation" | "message";

export async function setLogChannel(guildId: string, logType: LogType, channelId: string) {
  await db
    .insert(logChannels)
    .values({ guildId, logType, channelId })
    .onConflictDoUpdate({
      target: [logChannels.guildId, logChannels.logType],
      set: { channelId },
    })
    .run();
}

export async function getLogChannel(guildId: string, logType: LogType): Promise<string | undefined> {
  const row = await db
    .select()
    .from(logChannels)
    .where(and(eq(logChannels.guildId, guildId), eq(logChannels.logType, logType)))
    .get();
  return row?.channelId;
}
