import { Events, type GuildMember } from "discord.js";
import type { BotEvent } from "./loader";
import { sendLog } from "../services/loggingService";
import { memberJoinEmbed } from "../ui/embeds/logEmbeds";

const event: BotEvent = {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    await sendLog(member.guild, "member", memberJoinEmbed(member));
  },
};

export default event;
