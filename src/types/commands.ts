import { SlashCommandBuilder, CommandInteraction, ChatInputCommandInteraction, SlashCommandOptionsOnlyBuilder } from "discord.js";

export interface SlashCommand {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface CommandContext {
    interaction: ChatInputCommandInteraction;
    args?: string[];
}
