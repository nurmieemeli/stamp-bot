import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { buildCustomId } from "../../utils/customId";

export function announcementModal(customIdArgs: string[]) {
  const title = new TextInputBuilder()
    .setCustomId("title")
    .setLabel("Title")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(256);

  const body = new TextInputBuilder()
    .setCustomId("body")
    .setLabel("Message")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4000);

  return new ModalBuilder()
    .setCustomId(buildCustomId("announce-modal", ...customIdArgs))
    .setTitle("Create announcement")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(title),
      new ActionRowBuilder<TextInputBuilder>().addComponents(body)
    );
}
