import { randomUUID } from "node:crypto";
import { EmbedBuilder } from "discord.js";

export interface PendingAnnouncement {
  channelId: string;
  pingRoleId?: string;
  imageUrl?: string;
  color?: number;
}

const PENDING_TTL_MS = 15 * 60 * 1000;
const pending = new Map<string, PendingAnnouncement>();

export function stashPendingAnnouncement(data: PendingAnnouncement): string {
  const token = randomUUID().slice(0, 16);
  pending.set(token, data);
  setTimeout(() => pending.delete(token), PENDING_TTL_MS).unref();
  return token;
}

export function popPendingAnnouncement(token: string): PendingAnnouncement | undefined {
  const data = pending.get(token);
  pending.delete(token);
  return data;
}

const DEFAULT_COLOR = 0x5865f2;

export function buildAnnouncementEmbed(params: { title: string; body: string; imageUrl?: string; color?: number }) {
  const embed = new EmbedBuilder()
    .setColor(params.color ?? DEFAULT_COLOR)
    .setTitle(params.title)
    .setDescription(params.body)
    .setTimestamp();

  if (params.imageUrl) embed.setImage(params.imageUrl);

  return embed;
}

export function parseHexColor(input: string | null): number | undefined {
  if (!input) return undefined;
  const hex = input.replace("#", "");
  const value = parseInt(hex, 16);
  return Number.isNaN(value) ? undefined : value;
}
