import { EmbedBuilder } from "discord.js";
import type { ModerationCase } from "../../db/schema";
import { formatDuration } from "../../utils/duration";

const TYPE_META: Record<ModerationCase["type"], { color: number; label: string }> = {
  warn: { color: 0xf1c40f, label: "Warned" },
  timeout: { color: 0xe67e22, label: "Timed out" },
  kick: { color: 0xed4245, label: "Kicked" },
  ban: { color: 0x992d22, label: "Banned" },
  unban: { color: 0x3498db, label: "Unbanned" },
};

export function caseLogEmbed(entry: ModerationCase) {
  const meta = TYPE_META[entry.type];
  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setAuthor({ name: `Case #${entry.id} — ${meta.label}` })
    .addFields(
      { name: "User", value: `${entry.targetTag} (<@${entry.targetId}>)` },
      { name: "Moderator", value: `<@${entry.moderatorId}>`, inline: true },
      { name: "Reason", value: entry.reason ?? "No reason provided", inline: true }
    )
    .setTimestamp(entry.createdAt);

  if (entry.durationMs) {
    embed.addFields({ name: "Duration", value: formatDuration(entry.durationMs), inline: true });
  }

  return embed;
}

export function modLogHistoryEmbed(targetTag: string, targetId: string, cases: ModerationCase[]) {
  const embed = new EmbedBuilder()
    .setColor(0x99aab5)
    .setTitle(`Moderation history: ${targetTag}`)
    .setFooter({ text: `User ID: ${targetId}` })
    .setTimestamp();

  if (cases.length === 0) {
    embed.setDescription("No moderation cases on record for this user.");
    return embed;
  }

  const lines = cases.map((entry) => {
    const meta = TYPE_META[entry.type];
    const duration = entry.durationMs ? ` (${formatDuration(entry.durationMs)})` : "";
    const timestamp = `<t:${Math.floor(entry.createdAt / 1000)}:d>`;
    return `**#${entry.id}** ${meta.label}${duration} — ${entry.reason ?? "No reason provided"} · by <@${entry.moderatorId}> · ${timestamp}`;
  });

  embed.setDescription(lines.join("\n"));
  return embed;
}

export function dmNoticeEmbed(
  guildName: string,
  params: { type: ModerationCase["type"]; reason?: string | null; durationMs?: number | null }
) {
  const meta = TYPE_META[params.type];
  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(`You were ${meta.label.toLowerCase()} in ${guildName}`)
    .addFields({ name: "Reason", value: params.reason ?? "No reason provided" })
    .setTimestamp();

  if (params.durationMs) {
    embed.addFields({ name: "Duration", value: formatDuration(params.durationMs) });
  }

  return embed;
}
