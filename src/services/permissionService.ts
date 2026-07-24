import { GuildMember, PermissionsBitField } from "discord.js";
import { getOrCreateGuildConfig } from "../db/repositories/guildConfigRepo";

export async function isSupportStaff(member: GuildMember): Promise<boolean> {
  if (member.permissions.has(PermissionsBitField.Flags.ManageThreads)) return true;
  const config = await getOrCreateGuildConfig(member.guild.id);
  if (config.ticketSupportRoleId && member.roles.cache.has(config.ticketSupportRoleId)) {
    return true;
  }
  return false;
}

export async function canAnnounce(member: GuildMember): Promise<boolean> {
  if (member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return true;
  const config = await getOrCreateGuildConfig(member.guild.id);
  if (config.announcementStaffRoleId && member.roles.cache.has(config.announcementStaffRoleId)) {
    return true;
  }
  return false;
}

export function isTicketOpener(member: GuildMember, openerId: string): boolean {
  return member.id === openerId;
}
