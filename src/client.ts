import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import type { Command } from "./types";

export class BotClient extends Client {
  public commands = new Collection<string, Command>();
}

export function createClient(): BotClient {
  return new BotClient({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.GuildMember, Partials.Channel, Partials.ThreadMember],
  });
}
