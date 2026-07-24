import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { buildCustomId } from "../../utils/customId";

export function ticketPanelRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildCustomId("ticket-open"))
      .setLabel("Open a ticket")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🎫")
  );
}

export function ticketControlRow(opts: { claimed: boolean }) {
  const row = new ActionRowBuilder<ButtonBuilder>();
  if (!opts.claimed) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId("ticket-claim"))
        .setLabel("Claim")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✋")
    );
  }
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(buildCustomId("ticket-close"))
      .setLabel("Close")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔒")
  );
  return row;
}
