import { env } from "./config/env";
import { createClient } from "./client";
import { loadCommands } from "./commands/loader";
import { loadEvents } from "./events/loader";
import { runMigrations } from "./db";
import { logger } from "./utils/logger";

async function main() {
  await runMigrations();

  const client = createClient();

  loadCommands(client);
  loadEvents(client);

  client.on("error", (error) => logger.error(error, "Discord client error"));
  process.on("unhandledRejection", (reason) => logger.error(reason, "Unhandled promise rejection"));

  await client.login(env.DISCORD_TOKEN);
}

main().catch((error) => {
  logger.error(error, "Fatal startup error");
  process.exit(1);
});
