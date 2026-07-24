import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "../../types";
import { isModerator } from "../../services/permissionService";
import { assertValidModerationTarget, kickMember, ModerationError } from "../../services/moderationService";

const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Kick a member from the server")
  .addUserOption((opt) => opt.setName("user").setDescription("Member to kick").setRequired(true))
  .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the kick"));

async function execute(interaction: ChatInputCommandInteraction) {
  const moderator = interaction.member as GuildMember;
  if (!(await isModerator(moderator))) {
    await interaction.reply({ content: "You don't have permission to use moderation commands.", flags: MessageFlags.Ephemeral });
    return;
  }

  const user = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason") ?? undefined;

  try {
    assertValidModerationTarget(interaction.guild!, moderator, user.id);

    const target = await interaction.guild!.members.fetch(user.id).catch(() => null);
    if (!target) {
      await interaction.reply({ content: "That user isn't a member of this server.", flags: MessageFlags.Ephemeral });
      return;
    }

    const entry = await kickMember(interaction.guild!, target, moderator, reason);
    await interaction.reply({ content: `👢 Kicked ${target.user.tag} — case #${entry.id}.`, flags: MessageFlags.Ephemeral });
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
