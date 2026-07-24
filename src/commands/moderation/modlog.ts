import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "../../types";
import { isModerator } from "../../services/permissionService";
import { getModerationHistory } from "../../services/moderationService";
import { modLogHistoryEmbed } from "../../ui/embeds/moderationEmbeds";

const data = new SlashCommandBuilder()
  .setName("modlog")
  .setDescription("View a user's moderation case history")
  .addUserOption((opt) => opt.setName("user").setDescription("User to look up").setRequired(true));

async function execute(interaction: ChatInputCommandInteraction) {
  const moderator = interaction.member as GuildMember;
  if (!(await isModerator(moderator))) {
    await interaction.reply({ content: "You don't have permission to use moderation commands.", flags: MessageFlags.Ephemeral });
    return;
  }

  const target = interaction.options.getUser("user", true);
  const cases = await getModerationHistory(interaction.guildId!, target.id);

  await interaction.reply({
    embeds: [modLogHistoryEmbed(target.tag, target.id, cases)],
    flags: MessageFlags.Ephemeral,
  });
}

const command: Command = { data, execute };
export default command;
