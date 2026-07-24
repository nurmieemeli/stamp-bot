import { EmbedBuilder, type User, type GuildMember } from "discord.js";

const COLORS = {
  join: 0x57f287,
  leave: 0x99aab5,
  kick: 0xed4245,
  ban: 0x992d22,
  unban: 0x3498db,
  timeout: 0xe67e22,
  roleAdd: 0x57f287,
  roleRemove: 0x99aab5,
  messageDelete: 0xed4245,
  messageUpdate: 0xf1c40f,
} as const;

export function memberJoinEmbed(member: GuildMember) {
  return new EmbedBuilder()
    .setColor(COLORS.join)
    .setAuthor({ name: `${member.user.tag ?? member.user.username} joined`, iconURL: member.user.displayAvatarURL() })
    .addFields({ name: "Account created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` })
    .setFooter({ text: `ID: ${member.id}` })
    .setTimestamp();
}

export function memberLeaveEmbed(user: User) {
  return new EmbedBuilder()
    .setColor(COLORS.leave)
    .setAuthor({ name: `${user.tag ?? user.username} left`, iconURL: user.displayAvatarURL() })
    .setFooter({ text: `ID: ${user.id}` })
    .setTimestamp();
}

export function memberKickEmbed(user: User, moderatorTag?: string | null, reason?: string | null) {
  return new EmbedBuilder()
    .setColor(COLORS.kick)
    .setAuthor({ name: `${user.tag ?? user.username} was kicked`, iconURL: user.displayAvatarURL() })
    .addFields(
      { name: "Moderator", value: moderatorTag ?? "Unknown", inline: true },
      { name: "Reason", value: reason ?? "No reason provided", inline: true }
    )
    .setFooter({ text: `ID: ${user.id}` })
    .setTimestamp();
}

export function banEmbed(user: User, moderatorTag?: string | null, reason?: string | null) {
  return new EmbedBuilder()
    .setColor(COLORS.ban)
    .setAuthor({ name: `${user.tag ?? user.username} was banned`, iconURL: user.displayAvatarURL() })
    .addFields(
      { name: "Moderator", value: moderatorTag ?? "Unknown", inline: true },
      { name: "Reason", value: reason ?? "No reason provided", inline: true }
    )
    .setFooter({ text: `ID: ${user.id}` })
    .setTimestamp();
}

export function unbanEmbed(user: User, moderatorTag?: string | null) {
  return new EmbedBuilder()
    .setColor(COLORS.unban)
    .setAuthor({ name: `${user.tag ?? user.username} was unbanned`, iconURL: user.displayAvatarURL() })
    .addFields({ name: "Moderator", value: moderatorTag ?? "Unknown", inline: true })
    .setFooter({ text: `ID: ${user.id}` })
    .setTimestamp();
}

export function timeoutEmbed(member: GuildMember, until: Date | null) {
  const applied = until !== null;
  return new EmbedBuilder()
    .setColor(COLORS.timeout)
    .setAuthor({
      name: `${member.user.tag ?? member.user.username} ${applied ? "was timed out" : "had their timeout removed"}`,
      iconURL: member.user.displayAvatarURL(),
    })
    .addFields(
      applied
        ? [{ name: "Until", value: `<t:${Math.floor(until.getTime() / 1000)}:F>` }]
        : []
    )
    .setFooter({ text: `ID: ${member.id}` })
    .setTimestamp();
}

export function roleChangeEmbed(member: GuildMember, added: string[], removed: string[]) {
  const embed = new EmbedBuilder()
    .setColor(added.length ? COLORS.roleAdd : COLORS.roleRemove)
    .setAuthor({ name: `${member.user.tag ?? member.user.username}'s roles changed`, iconURL: member.user.displayAvatarURL() })
    .setFooter({ text: `ID: ${member.id}` })
    .setTimestamp();
  if (added.length) embed.addFields({ name: "Added", value: added.join(", ") });
  if (removed.length) embed.addFields({ name: "Removed", value: removed.join(", ") });
  return embed;
}

export function messageDeleteEmbed(params: {
  authorTag?: string;
  authorId?: string;
  channelId: string;
  content: string | null;
}) {
  return new EmbedBuilder()
    .setColor(COLORS.messageDelete)
    .setAuthor({ name: `Message deleted in <#${params.channelId}>` })
    .addFields(
      { name: "Author", value: params.authorTag ?? "Unknown", inline: true },
      { name: "Content", value: params.content ?? "*Content unavailable (not cached)*" }
    )
    .setFooter({ text: params.authorId ? `ID: ${params.authorId}` : "" })
    .setTimestamp();
}

export function messageUpdateEmbed(params: {
  authorTag?: string;
  authorId?: string;
  channelId: string;
  before: string | null;
  after: string;
  url: string;
}) {
  return new EmbedBuilder()
    .setColor(COLORS.messageUpdate)
    .setAuthor({ name: `Message edited in <#${params.channelId}>` })
    .addFields(
      { name: "Author", value: params.authorTag ?? "Unknown", inline: true },
      { name: "Before", value: params.before ?? "*Content unavailable (not cached)*" },
      { name: "After", value: params.after }
    )
    .setURL(params.url)
    .setFooter({ text: params.authorId ? `ID: ${params.authorId}` : "" })
    .setTimestamp();
}
