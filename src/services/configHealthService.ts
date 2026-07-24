import { PermissionFlagsBits, type Guild } from "discord.js";
import type { GuildConfig } from "../db/schema";
import { getLogChannel } from "../db/repositories/guildConfigRepo";

export interface HealthField {
  name: string;
  value: string;
  inline?: boolean;
}

async function checkChannel(
  guild: Guild,
  channelId: string | null,
  requiredPerms: bigint[]
): Promise<string> {
  if (!channelId) return "Not set";

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel) return `⚠️ Channel not found (was <#${channelId}> deleted?)`;

  const me = guild.members.me;
  const perms = me ? channel.permissionsFor(me) : null;
  const missing = perms ? requiredPerms.filter((perm) => !perms.has(perm)) : requiredPerms;

  if (missing.length > 0) {
    const names = missing.map((perm) => permissionName(perm)).join(", ");
    return `⚠️ <#${channelId}> — missing permission(s): ${names}`;
  }

  return `✅ <#${channelId}>`;
}

async function checkRole(guild: Guild, roleId: string | null): Promise<string> {
  if (!roleId) return "Not set";
  const role = await guild.roles.fetch(roleId).catch(() => null);
  if (!role) return `⚠️ Role not found (was <@&${roleId}> deleted?)`;
  return `✅ <@&${roleId}>`;
}

function permissionName(perm: bigint): string {
  const entry = Object.entries(PermissionFlagsBits).find(([, value]) => value === perm);
  return entry ? entry[0] : "Unknown";
}

const LOG_CHANNEL_PERMS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
];

export async function buildConfigHealthFields(guild: Guild, config: GuildConfig): Promise<HealthField[]> {
  const [
    ticketChannel,
    ticketRole,
    transcriptChannel,
    announceChannel,
    announceRole,
    moderatorRole,
    memberLogChannelId,
    moderationLogChannelId,
    messageLogChannelId,
  ] = await Promise.all([
    checkChannel(guild, config.ticketChannelId, [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.CreatePrivateThreads,
    ]),
    checkRole(guild, config.ticketSupportRoleId),
    checkChannel(guild, config.ticketTranscriptChannelId, [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
    ]),
    checkChannel(guild, config.announcementDefaultChannelId, [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
    ]),
    checkRole(guild, config.announcementStaffRoleId),
    checkRole(guild, config.moderatorRoleId),
    getLogChannel(guild.id, "member"),
    getLogChannel(guild.id, "moderation"),
    getLogChannel(guild.id, "message"),
  ]);

  const [memberLog, moderationLog, messageLog] = await Promise.all([
    checkChannel(guild, memberLogChannelId ?? null, LOG_CHANNEL_PERMS),
    checkChannel(guild, moderationLogChannelId ?? null, LOG_CHANNEL_PERMS),
    checkChannel(guild, messageLogChannelId ?? null, LOG_CHANNEL_PERMS),
  ]);

  return [
    { name: "Ticket channel", value: ticketChannel, inline: true },
    { name: "Ticket support role", value: ticketRole, inline: true },
    { name: "Ticket transcript channel", value: transcriptChannel, inline: true },
    { name: "Announcement channel", value: announceChannel, inline: true },
    { name: "Announcement staff role", value: announceRole, inline: true },
    { name: "Moderator role", value: moderatorRole, inline: true },
    { name: "Member log", value: memberLog, inline: true },
    { name: "Moderation log", value: moderationLog, inline: true },
    { name: "Message log", value: messageLog, inline: true },
  ];
}
