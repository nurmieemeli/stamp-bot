import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "../../types";
import { isModerator } from "../../services/permissionService";
import { assertValidModerationTarget, warnUser, ModerationError } from "../../services/moderationService";

const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Warn a user (logged, no removal)")
  .addUserOption((opt) => opt.setName("user").setDescription("User to warn").setRequired(true))
  .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the warning").setRequired(true));

async function execute(interaction: ChatInputCommandInteraction) {
  const moderator = interaction.member as GuildMember;
  if (!(await isModerator(moderator))) {
    await interaction.reply({ content: "You don't have permission to use moderation commands.", flags: MessageFlags.Ephemeral });
    return;
  }

  const target = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason", true);

  try {
    assertValidModerationTarget(interaction.guild!, moderator, target.id);
    const entry = await warnUser(interaction.guild!, target, moderator, reason);
    await interaction.reply({
      content: `⚠️ Warned ${target.tag} — case #${entry.id}.`,
      flags: MessageFlags.Ephemeral,
    });
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
