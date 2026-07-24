import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "../../types";
import { isModerator } from "../../services/permissionService";
import { assertValidModerationTarget, banUser, ModerationError } from "../../services/moderationService";

const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Ban a user from the server (works even if they've already left)")
  .addUserOption((opt) => opt.setName("user").setDescription("User to ban").setRequired(true))
  .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the ban"))
  .addIntegerOption((opt) =>
    opt
      .setName("delete_message_days")
      .setDescription("Delete this user's messages from the last N days (0-7)")
      .setMinValue(0)
      .setMaxValue(7)
  );

async function execute(interaction: ChatInputCommandInteraction) {
  const moderator = interaction.member as GuildMember;
  if (!(await isModerator(moderator))) {
    await interaction.reply({ content: "You don't have permission to use moderation commands.", flags: MessageFlags.Ephemeral });
    return;
  }

  const target = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason") ?? undefined;
  const deleteMessageDays = interaction.options.getInteger("delete_message_days") ?? 0;

  try {
    assertValidModerationTarget(interaction.guild!, moderator, target.id);
    const entry = await banUser(interaction.guild!, target, moderator, reason, deleteMessageDays * 86400);
    await interaction.reply({ content: `🔨 Banned ${target.tag} — case #${entry.id}.`, flags: MessageFlags.Ephemeral });
  } catch (err) {
    if (err instanceof ModerationError) {
      await interaction.reply({ content: err.message, flags: MessageFlags.Ephemeral });
      return;
    }
    throw err;
  }
}

const command: Command = { data, execute };
export default command;
