import { AuditLogEvent, Events, type GuildMember, type PartialGuildMember } from "discord.js";
import type { BotEvent } from "./loader";
import { sendLog } from "../services/loggingService";
import { roleChangeEmbed, timeoutEmbed } from "../ui/embeds/logEmbeds";

const RECENT_MS = 5000;

const event: BotEvent = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
    const oldTimeout = oldMember.communicationDisabledUntilTimestamp ?? null;
    const newTimeout = newMember.communicationDisabledUntilTimestamp ?? null;
    if (oldTimeout !== newTimeout) {
      const guild = newMember.guild;
      const entry = await guild
        .fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 5 })
        .then((logs) =>
          logs.entries.find(
            (e) =>
              e.target?.id === newMember.id &&
              Date.now() - e.createdTimestamp < RECENT_MS &&
              e.changes?.some((c) => c.key === "communication_disabled_until")
          )
        )
        .catch(() => undefined);

      // /timeout already logs this with correct moderator attribution.
      if (entry?.executor?.id !== guild.client.user.id) {
        await sendLog(
          guild,
          "moderation",
          timeoutEmbed(newMember, newTimeout ? new Date(newTimeout) : null, entry?.executor?.tag, entry?.reason)
        );
      }
    }

    const oldRoles = new Set(oldMember.roles.cache.keys());
    const newRoles = new Set(newMember.roles.cache.keys());

    const added = [...newRoles]
      .filter((id) => !oldRoles.has(id))
      .map((id) => `<@&${id}>`);
    const removed = [...oldRoles]
      .filter((id) => !newRoles.has(id))
      .map((id) => `<@&${id}>`);

    if (added.length || removed.length) {
      await sendLog(newMember.guild, "moderation", roleChangeEmbed(newMember, added, removed));
    }
  },
};

export default event;
