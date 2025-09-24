import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SlashCommand } from "@types/commands";
import { DatabaseManager } from "@utils/database";
import EmbedUtils from "@utils/embeds";
import osuAPI from "@utils/osu";
import { GameMode } from "@types/osu";

const modeCommand: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName('mode')
        .setDescription('Change your default game mode')
        .addStringOption(option =>
            option.setName('gamemode')
                .setDescription('Game mode to set as default')
                .setRequired(true)
                .addChoices(
                    { name: 'osu!', value: 'osu' },
                    { name: 'osu!taiko', value: 'taiko' },
                    { name: 'osu!catch', value: 'fruits' },
                    { name: 'osu!mania', value: 'mania' }
                )),

    async execute(interaction: ChatInputCommandInteraction) {
        const newMode = interaction.options.getString('gamemode', true) as GameMode;

        await interaction.deferReply();

        try {
            // Check if user is linked
            const dbUser = DatabaseManager.getUser(interaction.user.id);
            
            if (!dbUser) {
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed('You have not linked an osu! account. Use `/link` first.')]
                });
                return;
            }

            // Update user's default mode
            const success = DatabaseManager.updateUserMode(interaction.user.id, newMode);
            
            if (!success) {
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed('Failed to update your default mode. Please try again.')]
                });
                return;
            }

            const embed = EmbedUtils.createSuccessEmbed(
                `Successfully updated your default mode to **${osuAPI.getModeEmoji(newMode)}**`
            );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in mode command:', error);
            await interaction.editReply({
                embeds: [EmbedUtils.createErrorEmbed('An error occurred while updating your mode.')]
            });
        }
    }
};

export default modeCommand;
