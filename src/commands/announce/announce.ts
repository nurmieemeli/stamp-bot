import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
  type TextChannel,
} from "discord.js";
import type { Command } from "../../types";
import { canAnnounce } from "../../services/permissionService";
import { getOrCreateGuildConfig } from "../../db/repositories/guildConfigRepo";
import { parseHexColor, stashPendingAnnouncement } from "../../services/announcementService";
import { announcementModal } from "../../ui/modals/announcementModal";

const data = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Post an announcement")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("Channel to post in (defaults to the configured announcement channel)")
      .addChannelTypes(ChannelType.GuildText)
  )
  .addRoleOption((opt) => opt.setName("ping_role").setDescription("Role to mention with the announcement"))
  .addAttachmentOption((opt) => opt.setName("image").setDescription("Image to attach to the announcement"))
  .addStringOption((opt) => opt.setName("color").setDescription("Hex color for the embed, e.g. #5865F2"));

async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  if (!(await canAnnounce(member))) {
    await interaction.reply({ content: "You don't have permission to post announcements.", ephemeral: true });
    return;
  }

  const config = await getOrCreateGuildConfig(interaction.guildId!);
  const channel = (interaction.options.getChannel("channel") as TextChannel | null)?.id ?? config.announcementDefaultChannelId;

  if (!channel) {
    await interaction.reply({
      content: "No channel specified and no default announcement channel is configured. Provide a channel or run /config set-announcement-channel.",
      ephemeral: true,
    });
    return;
  }

  const role = interaction.options.getRole("ping_role");
  const image = interaction.options.getAttachment("image");
  const color = parseHexColor(interaction.options.getString("color"));

  const token = stashPendingAnnouncement({
    channelId: channel,
    pingRoleId: role?.id,
    imageUrl: image?.url,
    color,
  });

  await interaction.showModal(announcementModal([token]));
}

const command: Command = { data, execute };
export default command;
