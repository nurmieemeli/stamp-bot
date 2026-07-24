import type { Client } from "discord.js";
import { Events } from "discord.js";
import { logger } from "../utils/logger";
import type { BotEvent } from "./loader";

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client<true>) {
    logger.info(`Logged in as ${client.user.tag}`);
  },
};

export default event;
