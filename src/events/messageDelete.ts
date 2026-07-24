import { Events, type Message, type PartialMessage } from "discord.js";
import type { BotEvent } from "./loader";
import { sendLog } from "../services/loggingService";
import { messageDeleteEmbed } from "../ui/embeds/logEmbeds";

const event: BotEvent = {
  name: Events.MessageDelete,
  async execute(message: Message | PartialMessage) {
    if (!message.guild || message.author?.bot) return;

    await sendLog(
      message.guild,
      "message",
      messageDeleteEmbed({
        authorTag: message.author?.tag,
        authorId: message.author?.id,
        channelId: message.channelId,
        content: message.content,
      })
    );
  },
};

export default event;
