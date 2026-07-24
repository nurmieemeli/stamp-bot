import path from "node:path";
import fs from "node:fs";
import type { BotClient } from "../client";
import { logger } from "../utils/logger";

export interface BotEvent {
  name: string;
  once?: boolean;
  execute(...args: unknown[]): Promise<void> | void;
}

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) &&
      !entry.name.endsWith(".d.ts") &&
      entry.name !== "loader.ts" &&
      entry.name !== "loader.js"
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

export function loadEvents(client: BotClient) {
  const files = walk(__dirname);
  let count = 0;
  for (const file of files) {
    const mod = require(file);
    const event: BotEvent | undefined = mod.default ?? mod.event;
    if (!event?.name || !event.execute) {
      logger.warn(`Skipping ${file}: missing default event export`);
      continue;
    }
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    count++;
  }
  logger.info(`Loaded ${count} event handler(s)`);
}
