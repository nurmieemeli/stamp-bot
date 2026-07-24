import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../types";
import { getOrCreateGuildConfig } from "../../db/repositories/guildConfigRepo";
import { setupEmbed } from "../../ui/embeds/setupEmbeds";
import { setupComponents } from "../../ui/components/setupSelects";
import { buildConfigHealthFields } from "../../services/configHealthService";

const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Configure ticket/announcement channels and roles with an interactive menu")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function execute(interaction: ChatInputCommandInteraction) {
  const config = await getOrCreateGuildConfig(interaction.guildId!);
  const fields = await buildConfigHealthFields(interaction.guild!, config);

  await interaction.reply({
    embeds: [setupEmbed(fields)],
    components: setupComponents(config),
    ephemeral: true,
  });
}

const command: Command = { data, execute };
export default command;
