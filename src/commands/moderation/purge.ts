import {
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
  type TextChannel,
} from "discord.js";
import type { Command } from "../../types";
import { isModerator } from "../../services/permissionService";
import { logger } from "../../utils/logger";

const data = new SlashCommandBuilder()
  .setName("purge")
  .setDescription("Bulk-delete recent messages in this channel")
  .addIntegerOption((opt) =>
    opt.setName("amount").setDescription("How many messages to delete (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)
  )
  .addUserOption((opt) => opt.setName("user").setDescription("Only delete messages from this user"));

async function execute(interaction: ChatInputCommandInteraction) {
  const moderator = interaction.member as GuildMember;
  if (!(await isModerator(moderator))) {
    await interaction.reply({ content: "You don't have permission to use moderation commands.", flags: MessageFlags.Ephemeral });
    return;
  }

  const channel = interaction.channel as TextChannel | null;
  if (!channel || !channel.isTextBased() || channel.isDMBased()) {
    await interaction.reply({ content: "This command can only be used in a server text channel.", flags: MessageFlags.Ephemeral });
    return;
  }

  const amount = interaction.options.getInteger("amount", true);
  const user = interaction.options.getUser("user");

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    let deletedCount: number;

    if (user) {
      const recent = await channel.messages.fetch({ limit: 100 });
      const toDelete = recent.filter((msg) => msg.author.id === user.id).first(amount);
      const deleted = await channel.bulkDelete(toDelete, true);
      deletedCount = deleted.size;
    } else {
      const deleted = await channel.bulkDelete(amount, true);
      deletedCount = deleted.size;
    }

    await interaction.editReply({
      content: `🧹 Deleted ${deletedCount} message(s)${deletedCount < amount ? " (some may have been older than 14 days, which Discord won't bulk-delete)" : ""}.`,
    });
  } catch (err) {
    logger.error(err, `Failed to purge messages in channel ${channel.id}`);
    await interaction.editReply({ content: "Something went wrong while deleting messages." });
  }
}

const command: Command = { data, execute };
export default command;
