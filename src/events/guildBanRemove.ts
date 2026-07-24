import { AuditLogEvent, Events, type GuildBan } from "discord.js";
import type { BotEvent } from "./loader";
import { sendLog } from "../services/loggingService";
import { unbanEmbed } from "../ui/embeds/logEmbeds";

const event: BotEvent = {
  name: Events.GuildBanRemove,
  async execute(ban: GuildBan) {
    const entry = await ban.guild
      .fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 5 })
      .then((logs) => logs.entries.find((e) => e.target?.id === ban.user.id))
      .catch(() => undefined);

    // /unban already logs this with correct moderator attribution.
    if (entry?.executor?.id === ban.client.user.id) return;

    await sendLog(ban.guild, "moderation", unbanEmbed(ban.user, entry?.executor?.tag));
  },
};

export default event;
