import {
  ChannelType,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Guild,
  type GuildMember,
  type TextChannel,
  type ThreadChannel,
} from "discord.js";
import {
  claimTicket as claimTicketRow,
  closeTicket as closeTicketRow,
  createTicket,
  getOpenTicketForUser,
  getTicketByThread,
} from "../db/repositories/ticketRepo";
import { getOrCreateGuildConfig } from "../db/repositories/guildConfigRepo";
import { isSupportStaff, isTicketOpener } from "./permissionService";
import { ticketClaimedEmbed, ticketClosedEmbed, ticketOpenedEmbed } from "../ui/embeds/ticketEmbeds";
import { ticketControlRow } from "../ui/components/ticketButtons";
import { generateAndPostTranscript } from "./transcriptService";
import { logger } from "../utils/logger";

export class TicketError extends Error {}

export async function openTicket(guild: Guild, opener: GuildMember): Promise<ThreadChannel> {
  const config = await getOrCreateGuildConfig(guild.id);
  if (!config.ticketChannelId) {
    throw new TicketError("Ticket support isn't configured yet. Ask an admin to run /config set-ticket-channel.");
  }

  const existing = await getOpenTicketForUser(guild.id, opener.id);
  if (existing) {
    throw new TicketError(`You already have an open ticket: <#${existing.threadId}>`);
  }

  const parent = await guild.channels.fetch(config.ticketChannelId).catch(() => null);
  if (!parent || parent.type !== ChannelType.GuildText) {
    throw new TicketError("The configured ticket channel is missing or invalid. Ask an admin to reconfigure it.");
  }

  const thread = await (parent as TextChannel).threads.create({
    name: `ticket-${opener.user.username}`.slice(0, 100),
    type: ChannelType.PrivateThread,
    invitable: false,
    autoArchiveDuration: 1440,
    reason: `Support ticket opened by ${opener.user.tag}`,
  });

  await thread.members.add(opener.id).catch((err) => logger.warn(err, "Failed to add opener to ticket thread"));

  await createTicket({ guildId: guild.id, threadId: thread.id, openerId: opener.id });

  const mention = config.ticketSupportRoleId ? `<@&${config.ticketSupportRoleId}>` : null;
  await thread.send({
    content: mention ?? undefined,
    embeds: [ticketOpenedEmbed(opener.id)],
    components: [ticketControlRow({ claimed: false })],
  });

  return thread;
}

export async function claimTicket(thread: ThreadChannel, staff: GuildMember) {
  const ticket = await getTicketByThread(thread.id);
  if (!ticket) throw new TicketError("This isn't a ticket thread.");
  if (ticket.status === "closed") throw new TicketError("This ticket is already closed.");
  if (!(await isSupportStaff(staff))) throw new TicketError("You don't have permission to claim tickets.");
  if (ticket.status === "claimed") {
    throw new TicketError(`This ticket is already claimed by <@${ticket.claimedBy}>.`);
  }

  await claimTicketRow(thread.id, staff.id);
  await thread.send({ embeds: [ticketClaimedEmbed(staff.id)], components: [ticketControlRow({ claimed: true })] });
}

export async function closeTicket(
  thread: ThreadChannel,
  staff: GuildMember,
  reason?: string
): Promise<void> {
  const ticket = await getTicketByThread(thread.id);
  if (!ticket) throw new TicketError("This isn't a ticket thread.");
  if (ticket.status === "closed") throw new TicketError("This ticket is already closed.");

  const canClose = isTicketOpener(staff, ticket.openerId) || (await isSupportStaff(staff));
  if (!canClose) throw new TicketError("You don't have permission to close this ticket.");

  await closeTicketRow(thread.id, staff.id, reason);

  await thread.send({ embeds: [ticketClosedEmbed(staff.id, reason)] });

  await generateAndPostTranscript(thread, { ...ticket, closedBy: staff.id, closeReason: reason ?? null });

  await thread.setLocked(true).catch((err) => logger.warn(err, "Failed to lock ticket thread"));
  await thread.setArchived(true).catch((err) => logger.warn(err, "Failed to archive ticket thread"));
}

export function requireTicketThread(
  interaction: ButtonInteraction | ChatInputCommandInteraction
): ThreadChannel {
  const channel = interaction.channel;
  if (!channel || !channel.isThread()) {
    throw new TicketError("This command can only be used inside a ticket thread.");
  }
  return channel;
}
