import type { Guild, EmbedBuilder } from "discord.js";
import { getLogChannel, type LogType } from "../db/repositories/guildConfigRepo";
import { logger } from "../utils/logger";

export async function sendLog(guild: Guild, logType: LogType, embed: EmbedBuilder) {
  const channelId = await getLogChannel(guild.id, logType);
  if (!channelId) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  await channel.send({ embeds: [embed] }).catch((err: unknown) => {
    logger.warn(err, `Failed to send ${logType} log in guild ${guild.id}`);
  });
}
