import { Events, type ThreadChannel } from "discord.js";
import type { BotEvent } from "./loader";
import { getTicketByThread, closeTicket as closeTicketRow } from "../db/repositories/ticketRepo";
import { generateAndPostTranscript } from "../services/transcriptService";
import { logger } from "../utils/logger";

const event: BotEvent = {
  name: Events.ThreadUpdate,
  async execute(oldThread: ThreadChannel, newThread: ThreadChannel) {
    if (oldThread.archived || !newThread.archived) return;

    const ticket = await getTicketByThread(newThread.id);
    if (!ticket || ticket.status === "closed") return;

    logger.info(`Ticket thread ${newThread.id} was archived externally; closing ticket record.`);
    await closeTicketRow(newThread.id, "system", "Closed externally (thread archived)");

    await generateAndPostTranscript(newThread, {
      ...ticket,
      status: "closed",
      closedBy: "system",
      closeReason: "Closed externally (thread archived)",
    }).catch((err) => logger.warn(err, "Failed to generate transcript for externally-closed ticket"));
  },
};

export default event;
