import { AuditLogEvent, Events, type GuildBan } from "discord.js";
import type { BotEvent } from "./loader";
import { sendLog } from "../services/loggingService";
import { banEmbed } from "../ui/embeds/logEmbeds";

const event: BotEvent = {
  name: Events.GuildBanAdd,
  async execute(ban: GuildBan) {
    const entry = await ban.guild
      .fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 5 })
      .then((logs) => logs.entries.find((e) => e.target?.id === ban.user.id))
      .catch(() => undefined);

    await sendLog(
      ban.guild,
      "moderation",
      banEmbed(ban.user, entry?.executor?.tag, ban.reason ?? entry?.reason ?? undefined)
    );
  },
};

export default event;
