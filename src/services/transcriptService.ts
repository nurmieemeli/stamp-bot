import type { ThreadChannel } from "discord.js";
import { createTranscript, ExportReturnType } from "discord-html-transcripts";
import { getOrCreateGuildConfig } from "../db/repositories/guildConfigRepo";
import { setTranscriptMessageId } from "../db/repositories/ticketRepo";
import { transcriptSummaryEmbed } from "../ui/embeds/ticketEmbeds";
import { logger } from "../utils/logger";
import type { Ticket } from "../db/schema";

// Discord API errors carry the full failed request (including any file buffers) on
// the error object; logging it directly would dump raw file bytes into the log.
function describeError(err: unknown) {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    return {
      name: e.name,
      message: e.message,
      code: e.code,
      status: e.status,
      method: e.method,
      url: e.url,
    };
  }
  return { message: String(err) };
}

export async function generateAndPostTranscript(thread: ThreadChannel, ticket: Ticket) {
  const config = await getOrCreateGuildConfig(thread.guildId);
  if (!config.ticketTranscriptChannelId) {
    logger.warn(
      `Ticket ${thread.id} closed but no transcript channel is configured for guild ${thread.guildId} (run /config set-ticket-transcript-channel).`
    );
    return;
  }

  const transcriptChannel = await thread.guild.channels.fetch(config.ticketTranscriptChannelId).catch(() => null);
  if (!transcriptChannel || !transcriptChannel.isTextBased()) {
    logger.warn(
      `Configured transcript channel ${config.ticketTranscriptChannelId} for guild ${thread.guildId} is missing or not text-based.`
    );
    return;
  }

  // discord-html-transcripts' bundled types lag behind discord.js's ThreadChannel shape
  // (createdTimestamp nullability); the runtime call is compatible.
  const attachment = await createTranscript(thread as unknown as Parameters<typeof createTranscript>[0], {
    limit: -1,
    returnType: ExportReturnType.Attachment,
    filename: `${thread.name}.html`,
    saveImages: false,
    poweredBy: false,
  }).catch((err: unknown) => {
    logger.error(describeError(err), `Failed to generate transcript for ticket thread ${thread.id}`);
    return null;
  });

  if (!attachment) {
    logger.warn(`Posting transcript summary for ticket ${thread.id} without a file (generation failed above).`);
  }

  const embed = transcriptSummaryEmbed({
    threadName: thread.name,
    openerId: ticket.openerId,
    claimedBy: ticket.claimedBy,
    closedBy: ticket.closedBy ?? "unknown",
    reason: ticket.closeReason,
  });

  const sent = await transcriptChannel
    .send({ embeds: [embed], files: attachment ? [attachment] : [] })
    .catch((err: unknown) => {
      logger.warn(describeError(err), "Failed to post transcript to log channel");
      return null;
    });

  if (sent) {
    await setTranscriptMessageId(thread.id, sent.id);
    logger.info(`Posted transcript for ticket ${thread.id} to channel ${transcriptChannel.id}.`);
  }

  const opener = await thread.guild.members.fetch(ticket.openerId).catch(() => null);
  if (opener && attachment) {
    await opener.send({ embeds: [embed], files: [attachment] }).catch(() => {
      logger.info(`Could not DM transcript to ${ticket.openerId} (DMs likely closed)`);
    });
  }
}
