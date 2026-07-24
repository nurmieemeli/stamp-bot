import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { buildCustomId } from "../../utils/customId";

export function ticketCloseModal() {
  const reasonInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Reason (optional)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(200);

  return new ModalBuilder()
    .setCustomId(buildCustomId("ticket-close-modal"))
    .setTitle("Close ticket")
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput));
}
