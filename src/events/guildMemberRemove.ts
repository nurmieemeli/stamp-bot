import { AuditLogEvent, Events, type GuildMember, type PartialGuildMember } from "discord.js";
import type { BotEvent } from "./loader";
import { sendLog } from "../services/loggingService";
import { memberLeaveEmbed, memberKickEmbed } from "../ui/embeds/logEmbeds";

const RECENT_MS = 5000;

const event: BotEvent = {
  name: Events.GuildMemberRemove,
  async execute(member: GuildMember | PartialGuildMember) {
    const guild = member.guild;

    const kickEntry = await guild
      .fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 5 })
      .then((logs) =>
        logs.entries.find(
          (entry) =>
            entry.target?.id === member.id && Date.now() - entry.createdTimestamp < RECENT_MS
        )
      )
      .catch(() => undefined);

    if (kickEntry) {
      // /kick already logs this with correct moderator attribution.
      if (kickEntry.executor?.id === guild.client.user.id) return;

      await sendLog(
        guild,
        "moderation",
        memberKickEmbed(member.user, kickEntry.executor?.tag, kickEntry.reason ?? undefined)
      );
      return;
    }

    await sendLog(guild, "member", memberLeaveEmbed(member.user));
  },
};

export default event;
