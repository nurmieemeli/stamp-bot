import { EmbedBuilder } from "discord.js";
import { BRAND_COLOR } from "../../utils/theme";

export function ticketPanelEmbed() {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle("Need help?")
    .setDescription("Click the button below to open a private support ticket with our team.");
}

export function ticketOpenedEmbed(openerId: string) {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle("Support ticket opened")
    .setDescription(
      `Thanks for reaching out, <@${openerId}>! Please describe your issue and a member of the support team will be with you shortly.`
    )
    .setTimestamp();
}

export function ticketClaimedEmbed(staffId: string) {
  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setDescription(`🎫 Ticket claimed by <@${staffId}>.`)
    .setTimestamp();
}

export function ticketClosedEmbed(staffId: string, reason?: string) {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle("Ticket closed")
    .setDescription(`Closed by <@${staffId}>${reason ? `\n**Reason:** ${reason}` : ""}`)
    .setTimestamp();
}

export function transcriptSummaryEmbed(params: {
  threadName: string;
  openerId: string;
  claimedBy?: string | null;
  closedBy: string;
  reason?: string | null;
  preview?: string;
}) {
  const embed = new EmbedBuilder()
    .setColor(0x99aab5)
    .setTitle(`Transcript: ${params.threadName}`)
    .addFields(
      { name: "Opened by", value: `<@${params.openerId}>`, inline: true },
      { name: "Claimed by", value: params.claimedBy ? `<@${params.claimedBy}>` : "Nobody", inline: true },
      { name: "Closed by", value: `<@${params.closedBy}>`, inline: true },
      { name: "Reason", value: params.reason ?? "No reason provided" }
    )
    .setTimestamp();

  if (params.preview) embed.setDescription(params.preview);

  return embed;
}
