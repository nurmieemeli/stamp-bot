import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../../types";
import { getOrCreateGuildConfig, setLogChannel, updateGuildConfig } from "../../db/repositories/guildConfigRepo";
import { buildConfigHealthFields } from "../../services/configHealthService";

const data = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Configure the bot for this server")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName("set-log-channel")
      .setDescription("Set the channel for a log category")
      .addStringOption((opt) =>
        opt
          .setName("type")
          .setDescription("Log category")
          .setRequired(true)
          .addChoices(
            { name: "Member (joins/leaves)", value: "member" },
            { name: "Moderation (bans/kicks/timeouts/roles)", value: "moderation" },
            { name: "Message (edits/deletes)", value: "message" }
          )
      )
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("Channel to send this log type to")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("set-ticket-channel")
      .setDescription("Set the parent channel where ticket threads are created")
      .addChannelOption((opt) =>
        opt.setName("channel").setDescription("Ticket parent channel").addChannelTypes(ChannelType.GuildText).setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("set-ticket-support-role")
      .setDescription("Set the role that can claim/close tickets")
      .addRoleOption((opt) => opt.setName("role").setDescription("Support role").setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName("set-ticket-transcript-channel")
      .setDescription("Set the channel where closed ticket transcripts are posted")
      .addChannelOption((opt) =>
        opt.setName("channel").setDescription("Transcript log channel").addChannelTypes(ChannelType.GuildText).setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("set-announcement-channel")
      .setDescription("Set the default channel for /announce")
      .addChannelOption((opt) =>
        opt.setName("channel").setDescription("Default announcement channel").addChannelTypes(ChannelType.GuildText).setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("set-announcement-role")
      .setDescription("Set an extra role allowed to use /announce")
      .addRoleOption((opt) => opt.setName("role").setDescription("Announcement staff role").setRequired(true))
  )
  .addSubcommand((sub) => sub.setName("view").setDescription("View the current configuration"));

async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
    return;
  }

  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId;

  switch (sub) {
    case "set-log-channel": {
      const type = interaction.options.getString("type", true) as "member" | "moderation" | "message";
      const channel = interaction.options.getChannel("channel", true);
      await setLogChannel(guildId, type, channel.id);
      await interaction.reply({ content: `${type} logs will now be sent to <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
      break;
    }
    case "set-ticket-channel": {
      const channel = interaction.options.getChannel("channel", true);
      await updateGuildConfig(guildId, { ticketChannelId: channel.id });
      await interaction.reply({ content: `Ticket threads will now be created under <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
      break;
    }
    case "set-ticket-support-role": {
      const role = interaction.options.getRole("role", true);
      await updateGuildConfig(guildId, { ticketSupportRoleId: role.id });
      await interaction.reply({ content: `<@&${role.id}> can now claim and close tickets.`, flags: MessageFlags.Ephemeral });
      break;
    }
    case "set-ticket-transcript-channel": {
      const channel = interaction.options.getChannel("channel", true);
      await updateGuildConfig(guildId, { ticketTranscriptChannelId: channel.id });
      await interaction.reply({ content: `Ticket transcripts will now be posted to <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
      break;
    }
    case "set-announcement-channel": {
      const channel = interaction.options.getChannel("channel", true);
      await updateGuildConfig(guildId, { announcementDefaultChannelId: channel.id });
      await interaction.reply({ content: `Default announcement channel set to <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
      break;
    }
    case "set-announcement-role": {
      const role = interaction.options.getRole("role", true);
      await updateGuildConfig(guildId, { announcementStaffRoleId: role.id });
      await interaction.reply({ content: `<@&${role.id}> can now use /announce.`, flags: MessageFlags.Ephemeral });
      break;
    }
    case "view": {
      const config = await getOrCreateGuildConfig(guildId);
      const fields = await buildConfigHealthFields(interaction.guild!, config);
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [
          {
            title: "Server configuration",
            description: "✅ configured and permissions look right · ⚠️ needs attention · plain \"Not set\" = not configured yet",
            fields,
          },
        ],
      });
      break;
    }
  }
}

const command: Command = { data, execute };
export default command;
