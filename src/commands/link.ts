import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SlashCommand } from "../types/commands";
import { DatabaseManager } from "@utils/database";
import osuAPI from "@utils/osu";
import EmbedUtils from "@utils/embeds";
import { GameMode } from "../types/osu";

const linkCommand: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Link your osu! account to your Discord account')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Your osu! username or user ID')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Default game mode')
                .setRequired(false)
                .addChoices(
                    { name: 'osu!', value: 'osu' },
                    { name: 'osu!taiko', value: 'taiko' },
                    { name: 'osu!catch', value: 'fruits' },
                    { name: 'osu!mania', value: 'mania' }
                )),

    async execute(interaction: ChatInputCommandInteraction) {
        const username = interaction.options.getString('username', true);
        const mode = (interaction.options.getString('mode') as GameMode) || 'osu';

        try {
            await interaction.deferReply();

            // Check if user exists
            const osuUser = await osuAPI.getUser(username, mode);
            
            if (!osuUser) {
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed('User not found. Please check the username and try again.')]
                });
                return;
            }

            // Save to database
            DatabaseManager.setUser(interaction.user.id, osuUser.id, osuUser.username, mode);

            const embed = EmbedUtils.createSuccessEmbed(
                `Successfully linked your account to **${osuUser.username}** (ID: ${osuUser.id})\nDefault mode set to: ${osuAPI.getModeEmoji(mode)}`
            );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in link command:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed('An error occurred while linking your account.')]
                });
            } else {
                await interaction.reply({
                    embeds: [EmbedUtils.createErrorEmbed('An error occurred while linking your account.')],
                    ephemeral: true
                });
            }
        }
    }
};

export default linkCommand;
