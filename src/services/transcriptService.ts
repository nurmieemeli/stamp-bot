import type { Message, ThreadChannel } from "discord.js";
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

const PREVIEW_MAX_CHARS = 3500;
const PREVIEW_MAX_MESSAGES = 200;

async function fetchThreadMessagesOldestFirst(thread: ThreadChannel): Promise<Message[]> {
  const messages: Message[] = [];
  let before: string | undefined;

  while (messages.length < PREVIEW_MAX_MESSAGES) {
    const batch = await thread.messages.fetch({ limit: 100, before });
    if (batch.size === 0) break;
    messages.push(...batch.values());
    before = batch.last()?.id;
    if (batch.size < 100) break;
  }

  return messages.reverse();
}

async function buildTranscriptPreview(thread: ThreadChannel): Promise<string> {
  const messages = await fetchThreadMessagesOldestFirst(thread).catch((err: unknown) => {
    logger.warn(describeError(err), `Failed to fetch messages for transcript preview of ${thread.id}`);
    return [] as Message[];
  });

  const lines = messages
    .filter((msg) => msg.content || msg.attachments.size > 0)
    .map((msg) => {
      const timestamp = `<t:${Math.floor(msg.createdTimestamp / 1000)}:t>`;
      const content = msg.content || `*${msg.attachments.size} attachment(s)*`;
      return `**${msg.author.tag}** ${timestamp}\n${content}`;
    });

  if (lines.length === 0) return "*No messages were sent in this ticket.*";

  let text = lines.join("\n\n");
  if (text.length > PREVIEW_MAX_CHARS) {
    text = `${text.slice(0, PREVIEW_MAX_CHARS)}\n\n*… truncated, see the attached file for the full transcript.*`;
  }

  return text;
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

  const preview = await buildTranscriptPreview(thread);

  const embed = transcriptSummaryEmbed({
    threadName: thread.name,
    openerId: ticket.openerId,
    claimedBy: ticket.claimedBy,
    closedBy: ticket.closedBy ?? "unknown",
    reason: ticket.closeReason,
    preview,
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
