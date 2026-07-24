import path from "node:path";
import fs from "node:fs";
import type { BotClient } from "../client";
import type { Command } from "../types";
import { logger } from "../utils/logger";

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

export function loadCommands(client: BotClient) {
  const files = walk(__dirname);
  for (const file of files) {
    const mod = require(file);
    const command: Command | undefined = mod.default ?? mod.command;
    if (!command?.data || !command.execute) {
      logger.warn(`Skipping ${file}: missing default command export`);
      continue;
    }
    client.commands.set(command.data.name, command);
  }
  logger.info(`Loaded ${client.commands.size} command(s)`);
}

export function getAllCommandData() {
  const files = walk(__dirname);
  const data: unknown[] = [];
  for (const file of files) {
    const mod = require(file);
    const command: Command | undefined = mod.default ?? mod.command;
    if (command?.data) {
      data.push(command.data.toJSON());
    }
  }
  return data;
}
