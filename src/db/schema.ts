import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const guildConfig = sqliteTable("guild_config", {
  guildId: text("guild_id").primaryKey(),
  ticketChannelId: text("ticket_channel_id"),
  ticketSupportRoleId: text("ticket_support_role_id"),
  ticketTranscriptChannelId: text("ticket_transcript_channel_id"),
  announcementDefaultChannelId: text("announcement_default_channel_id"),
  announcementStaffRoleId: text("announcement_staff_role_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const logChannels = sqliteTable(
  "log_channels",
  {
    guildId: text("guild_id").notNull(),
    logType: text("log_type", { enum: ["member", "moderation", "message"] }).notNull(),
    channelId: text("channel_id").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.logType] }),
  })
);

export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  guildId: text("guild_id").notNull(),
  threadId: text("thread_id").notNull().unique(),
  openerId: text("opener_id").notNull(),
  status: text("status", { enum: ["open", "claimed", "closed"] }).notNull().default("open"),
  claimedBy: text("claimed_by"),
  claimedAt: integer("claimed_at"),
  closedBy: text("closed_by"),
  closedAt: integer("closed_at"),
  closeReason: text("close_reason"),
  transcriptMessageId: text("transcript_message_id"),
  createdAt: integer("created_at").notNull(),
});

export type GuildConfig = typeof guildConfig.$inferSelect;
export type LogChannel = typeof logChannels.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
