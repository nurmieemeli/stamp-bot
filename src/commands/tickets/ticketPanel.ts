import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import type { Command } from "../../types";
import { ticketPanelEmbed } from "../../ui/embeds/ticketEmbeds";
import { ticketPanelRow } from "../../ui/components/ticketButtons";

const data = new SlashCommandBuilder()
  .setName("ticket-panel")
  .setDescription("Post the support ticket panel")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("Channel to post the panel in (defaults to this channel)")
      .addChannelTypes(ChannelType.GuildText)
  );

async function execute(interaction: ChatInputCommandInteraction) {
  const channel = (interaction.options.getChannel("channel") as TextChannel | null) ?? (interaction.channel as TextChannel);

  await channel.send({ embeds: [ticketPanelEmbed()], components: [ticketPanelRow()] });
  await interaction.reply({ content: `Ticket panel posted in <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
}

const command: Command = { data, execute };
export default command;
