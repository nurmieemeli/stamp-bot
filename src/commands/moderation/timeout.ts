import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "../../types";
import { isModerator } from "../../services/permissionService";
import { assertValidModerationTarget, timeoutMember, ModerationError } from "../../services/moderationService";
import { parseDuration, DurationParseError, formatDuration } from "../../utils/duration";

const data = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription("Temporarily time out a member")
  .addUserOption((opt) => opt.setName("user").setDescription("Member to time out").setRequired(true))
  .addStringOption((opt) =>
    opt.setName("duration").setDescription("e.g. 10m, 2h, 1d (max 28d)").setRequired(true)
  )
  .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the timeout"));

async function execute(interaction: ChatInputCommandInteraction) {
  const moderator = interaction.member as GuildMember;
  if (!(await isModerator(moderator))) {
    await interaction.reply({ content: "You don't have permission to use moderation commands.", flags: MessageFlags.Ephemeral });
    return;
  }

  const user = interaction.options.getUser("user", true);
  const durationInput = interaction.options.getString("duration", true);
  const reason = interaction.options.getString("reason") ?? undefined;

  try {
    assertValidModerationTarget(interaction.guild!, moderator, user.id);
    const durationMs = parseDuration(durationInput);

    const target = await interaction.guild!.members.fetch(user.id).catch(() => null);
    if (!target) {
      await interaction.reply({ content: "That user isn't a member of this server.", flags: MessageFlags.Ephemeral });
      return;
    }

    const entry = await timeoutMember(interaction.guild!, target, moderator, durationMs, reason);
    await interaction.reply({
      content: `⏱️ Timed out ${target.user.tag} for ${formatDuration(durationMs)} — case #${entry.id}.`,
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    if (err instanceof DurationParseError || err instanceof ModerationError) {
      await interaction.reply({ content: err.message, flags: MessageFlags.Ephemeral });
      return;
    }
    throw err;
  }
}

const command: Command = { data, execute };
export default command;
