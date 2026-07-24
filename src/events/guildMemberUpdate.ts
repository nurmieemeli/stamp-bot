import { Events, type GuildMember, type PartialGuildMember } from "discord.js";
import type { BotEvent } from "./loader";
import { sendLog } from "../services/loggingService";
import { roleChangeEmbed, timeoutEmbed } from "../ui/embeds/logEmbeds";

const event: BotEvent = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
    const oldTimeout = oldMember.communicationDisabledUntilTimestamp ?? null;
    const newTimeout = newMember.communicationDisabledUntilTimestamp ?? null;
    if (oldTimeout !== newTimeout) {
      await sendLog(
        newMember.guild,
        "moderation",
        timeoutEmbed(newMember, newTimeout ? new Date(newTimeout) : null)
      );
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
