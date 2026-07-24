import type { Guild, GuildMember, User } from "discord.js";
import { getLogChannel } from "../db/repositories/guildConfigRepo";
import { createCase, getCasesForUser, type ModerationCaseType } from "../db/repositories/moderationRepo";
import { caseLogEmbed, dmNoticeEmbed } from "../ui/embeds/moderationEmbeds";
import { logger } from "../utils/logger";
import type { ModerationCase } from "../db/schema";

export class ModerationError extends Error {}

/** Guards against self-moderation, targeting the bot/owner, or acting on someone with an equal/higher role. */
export function assertValidModerationTarget(guild: Guild, moderator: GuildMember, targetId: string) {
  if (targetId === moderator.id) {
    throw new ModerationError("You can't moderate yourself.");
  }
  if (targetId === guild.client.user.id) {
    throw new ModerationError("You can't moderate the bot.");
  }
  if (targetId === guild.ownerId) {
    throw new ModerationError("You can't moderate the server owner.");
  }

  const targetMember = guild.members.cache.get(targetId);
  const isModeratorOwner = moderator.id === guild.ownerId;
  if (targetMember && !isModeratorOwner && targetMember.roles.highest.position >= moderator.roles.highest.position) {
    throw new ModerationError("You can't moderate someone with an equal or higher role than you.");
  }
}

function discordErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "code" in err) {
    return `${fallback} (Discord error ${(err as { code: unknown }).code}).`;
  }
  return fallback;
}

async function postCaseLog(guild: Guild, entry: ModerationCase) {
  const channelId = await getLogChannel(guild.id, "moderation");
  if (!channelId) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  await channel.send({ embeds: [caseLogEmbed(entry)] }).catch((err: unknown) => {
    logger.warn(err, `Failed to post moderation case #${entry.id} to log channel`);
  });
}

async function dmTarget(
  guild: Guild,
  userId: string,
  params: { type: ModerationCaseType; reason?: string | null; durationMs?: number | null }
) {
  const user = await guild.client.users.fetch(userId).catch(() => null);
  if (!user) return;
  await user.send({ embeds: [dmNoticeEmbed(guild.name, params)] }).catch(() => {
    logger.info(`Could not DM moderation notice to ${userId} (DMs likely closed)`);
  });
}

async function recordAndAnnounce(
  guild: Guild,
  params: {
    type: ModerationCaseType;
    targetId: string;
    targetTag: string;
    moderatorId: string;
    reason?: string | null;
    durationMs?: number | null;
  }
): Promise<ModerationCase> {
  const entry = await createCase({ guildId: guild.id, ...params });
  await postCaseLog(guild, entry);
  return entry;
}

export async function warnUser(
  guild: Guild,
  target: User,
  moderator: GuildMember,
  reason?: string
): Promise<ModerationCase> {
  const entry = await recordAndAnnounce(guild, {
    type: "warn",
    targetId: target.id,
    targetTag: target.tag,
    moderatorId: moderator.id,
    reason,
  });
  await dmTarget(guild, target.id, { type: "warn", reason });
  return entry;
}

export async function timeoutMember(
  guild: Guild,
  target: GuildMember,
  moderator: GuildMember,
  durationMs: number,
  reason?: string
): Promise<ModerationCase> {
  await target.timeout(durationMs, reason).catch((err: unknown) => {
    throw new ModerationError(
      discordErrorMessage(err, "Failed to timeout member — check the bot has Moderate Members permission and a higher role than the target")
    );
  });

  const entry = await recordAndAnnounce(guild, {
    type: "timeout",
    targetId: target.id,
    targetTag: target.user.tag,
    moderatorId: moderator.id,
    reason,
    durationMs,
  });
  await dmTarget(guild, target.id, { type: "timeout", reason, durationMs });
  return entry;
}

export async function kickMember(
  guild: Guild,
  target: GuildMember,
  moderator: GuildMember,
  reason?: string
): Promise<ModerationCase> {
  // DM before removal — Discord may not allow messaging the user afterward if no shared server remains.
  await dmTarget(guild, target.id, { type: "kick", reason });

  await target.kick(reason).catch((err: unknown) => {
    throw new ModerationError(
      discordErrorMessage(err, "Failed to kick member — check the bot has Kick Members permission and a higher role than the target")
    );
  });

  return recordAndAnnounce(guild, {
    type: "kick",
    targetId: target.id,
    targetTag: target.user.tag,
    moderatorId: moderator.id,
    reason,
  });
}

export async function banUser(
  guild: Guild,
  target: User,
  moderator: GuildMember,
  reason?: string,
  deleteMessageSeconds?: number
): Promise<ModerationCase> {
  await dmTarget(guild, target.id, { type: "ban", reason });

  await guild.members.ban(target.id, { reason, deleteMessageSeconds }).catch((err: unknown) => {
    throw new ModerationError(
      discordErrorMessage(err, "Failed to ban user — check the bot has Ban Members permission and a higher role than the target")
    );
  });

  return recordAndAnnounce(guild, {
    type: "ban",
    targetId: target.id,
    targetTag: target.tag,
    moderatorId: moderator.id,
    reason,
  });
}

export async function unbanUser(
  guild: Guild,
  userId: string,
  moderator: GuildMember,
  reason?: string
): Promise<ModerationCase> {
  const ban = await guild.bans.fetch(userId).catch(() => null);
  if (!ban) {
    throw new ModerationError("That user isn't currently banned.");
  }

  await guild.members.unban(userId, reason).catch((err: unknown) => {
    throw new ModerationError(discordErrorMessage(err, "Failed to unban user"));
  });

  return recordAndAnnounce(guild, {
    type: "unban",
    targetId: userId,
    targetTag: ban.user.tag,
    moderatorId: moderator.id,
    reason,
  });
}

export async function getModerationHistory(guildId: string, targetId: string): Promise<ModerationCase[]> {
  return getCasesForUser(guildId, targetId);
}
