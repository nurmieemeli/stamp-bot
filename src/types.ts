import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder;

export interface Command {
  data: SlashCommandData;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
