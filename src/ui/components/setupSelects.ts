import { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder } from "discord.js";
import { buildCustomId } from "../../utils/customId";
import type { GuildConfig } from "../../db/schema";

export const SETUP_FIELD_COLUMN = {
  "ticket-channel": "ticketChannelId",
  "ticket-role": "ticketSupportRoleId",
  "transcript-channel": "ticketTranscriptChannelId",
  "announce-channel": "announcementDefaultChannelId",
  "announce-role": "announcementStaffRoleId",
} as const satisfies Record<string, keyof GuildConfig>;

export type SetupField = keyof typeof SETUP_FIELD_COLUMN;

function channelSelect(field: SetupField, placeholder: string, currentId: string | null) {
  const menu = new ChannelSelectMenuBuilder()
    .setCustomId(buildCustomId("setup-select", field))
    .setPlaceholder(placeholder)
    .setChannelTypes(ChannelType.GuildText)
    .setMinValues(0)
    .setMaxValues(1);
  if (currentId) menu.setDefaultChannels(currentId);
  return new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(menu);
}

function roleSelect(field: SetupField, placeholder: string, currentId: string | null) {
  const menu = new RoleSelectMenuBuilder()
    .setCustomId(buildCustomId("setup-select", field))
    .setPlaceholder(placeholder)
    .setMinValues(0)
    .setMaxValues(1);
  if (currentId) menu.setDefaultRoles(currentId);
  return new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(menu);
}

export function setupComponents(config: GuildConfig) {
  return [
    channelSelect("ticket-channel", "Ticket parent channel", config.ticketChannelId),
    roleSelect("ticket-role", "Ticket support role", config.ticketSupportRoleId),
    channelSelect("transcript-channel", "Ticket transcript channel", config.ticketTranscriptChannelId),
    channelSelect("announce-channel", "Announcement channel", config.announcementDefaultChannelId),
    roleSelect("announce-role", "Extra announcement staff role (optional)", config.announcementStaffRoleId),
  ];
}
