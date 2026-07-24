import { Events, type Message, type PartialMessage } from "discord.js";
import type { BotEvent } from "./loader";
import { sendLog } from "../services/loggingService";
import { messageUpdateEmbed } from "../ui/embeds/logEmbeds";

const event: BotEvent = {
  name: Events.MessageUpdate,
  async execute(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    await sendLog(
      newMessage.guild,
      "message",
      messageUpdateEmbed({
        authorTag: newMessage.author?.tag,
        authorId: newMessage.author?.id,
        channelId: newMessage.channelId,
        before: oldMessage.content,
        after: newMessage.content ?? "",
        url: newMessage.url,
      })
    );
  },
};

export default event;
