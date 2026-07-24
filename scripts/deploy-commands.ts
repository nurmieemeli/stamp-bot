import { REST, Routes } from "discord.js";
import { env } from "../src/config/env";
import { getAllCommandData } from "../src/commands/loader";
import { logger } from "../src/utils/logger";

async function main() {
  const isGlobal = process.argv.includes("--global");
  const body = getAllCommandData();
  const rest = new REST().setToken(env.DISCORD_TOKEN);

  const route = isGlobal
    ? Routes.applicationCommands(env.CLIENT_ID)
    : Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID);

  logger.info(`Registering ${body.length} command(s) ${isGlobal ? "globally" : "to guild " + env.GUILD_ID}...`);
  await rest.put(route, { body });
  logger.info("Command registration complete.");
}

main().catch((error) => {
  logger.error(error, "Failed to register commands");
  process.exit(1);
});
