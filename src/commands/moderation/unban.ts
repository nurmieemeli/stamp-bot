import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "../../types";
import { isModerator } from "../../services/permissionService";
import { unbanUser, ModerationError } from "../../services/moderationService";

const data = new SlashCommandBuilder()
  .setName("unban")
  .setDescription("Unban a user by their user ID")
  .addStringOption((opt) => opt.setName("user_id").setDescription("The banned user's ID").setRequired(true))
  .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the unban"));

async function execute(interaction: ChatInputCommandInteraction) {
  const moderator = interaction.member as GuildMember;
  if (!(await isModerator(moderator))) {
    await interaction.reply({ content: "You don't have permission to use moderation commands.", flags: MessageFlags.Ephemeral });
    return;
  }

  const userId = interaction.options.getString("user_id", true).trim();
  const reason = interaction.options.getString("reason") ?? undefined;

  if (!/^\d{17,20}$/.test(userId)) {
    await interaction.reply({ content: "That doesn't look like a valid user ID.", flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    const entry = await unbanUser(interaction.guild!, userId, moderator, reason);
    await interaction.reply({ content: `🔓 Unbanned ${entry.targetTag} — case #${entry.id}.`, flags: MessageFlags.Ephemeral });
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
