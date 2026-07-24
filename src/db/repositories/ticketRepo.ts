import { eq, and, ne } from "drizzle-orm";
import { db } from "../index";
import { tickets, type Ticket, type NewTicket } from "../schema";

function now() {
  return Date.now();
}

export async function createTicket(data: {
  guildId: string;
  threadId: string;
  openerId: string;
}): Promise<Ticket> {
  const values: NewTicket = {
    guildId: data.guildId,
    threadId: data.threadId,
    openerId: data.openerId,
    status: "open",
    createdAt: now(),
  };
  await db.insert(tickets).values(values).run();
  return (await db.select().from(tickets).where(eq(tickets.threadId, data.threadId)).get())!;
}

export async function getTicketByThread(threadId: string): Promise<Ticket | undefined> {
  return db.select().from(tickets).where(eq(tickets.threadId, threadId)).get();
}

export async function getOpenTicketForUser(guildId: string, userId: string): Promise<Ticket | undefined> {
  return db
    .select()
    .from(tickets)
    .where(
      and(eq(tickets.guildId, guildId), eq(tickets.openerId, userId), ne(tickets.status, "closed"))
    )
    .get();
}

export async function claimTicket(threadId: string, staffId: string) {
  await db
    .update(tickets)
    .set({ status: "claimed", claimedBy: staffId, claimedAt: now() })
    .where(eq(tickets.threadId, threadId))
    .run();
}

export async function closeTicket(threadId: string, staffId: string, reason?: string) {
  await db
    .update(tickets)
    .set({ status: "closed", closedBy: staffId, closedAt: now(), closeReason: reason ?? null })
    .where(eq(tickets.threadId, threadId))
    .run();
}

export async function setTranscriptMessageId(threadId: string, messageId: string) {
  await db.update(tickets).set({ transcriptMessageId: messageId }).where(eq(tickets.threadId, threadId)).run();
}
