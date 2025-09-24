import { SlashCommandBuilder, ChatInputCommandInteraction, User } from "discord.js";
import { SlashCommand } from "../types/commands";
import { DatabaseManager } from "@utils/database";
import osuAPI from "@utils/osu";
import EmbedUtils from "@utils/embeds";
import { GameMode } from "../types/osu";

const profileCommand: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View an osu! user profile')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Discord user to view profile for')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('username')
                .setDescription('osu! username or user ID')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Game mode')
                .setRequired(false)
                .addChoices(
                    { name: 'osu!', value: 'osu' },
                    { name: 'osu!taiko', value: 'taiko' },
                    { name: 'osu!catch', value: 'fruits' },
                    { name: 'osu!mania', value: 'mania' }
                )),

    async execute(interaction: ChatInputCommandInteraction) {
        const discordUser = interaction.options.getUser('user');
        const usernameInput = interaction.options.getString('username');
        const modeInput = interaction.options.getString('mode') as GameMode;

        try {
            await interaction.deferReply();

            let osuUsername: string | number;
            let mode: GameMode = 'osu';
            let dbUser;

            // Determine what user to fetch
            if (usernameInput) {
                // Direct username/ID input
                osuUsername = isNaN(Number(usernameInput)) ? usernameInput : Number(usernameInput);
                mode = modeInput || 'osu';
            } else {
                // Use Discord user (either mentioned or command author)
                const targetUserId = discordUser?.id || interaction.user.id;
                dbUser = DatabaseManager.getUser(targetUserId);
                
                if (!dbUser) {
                    const userMention = discordUser ? `<@${discordUser.id}>` : 'You';
                    await interaction.editReply({
                        embeds: [EmbedUtils.createErrorEmbed(
                            `${userMention} ${discordUser ? 'has' : 'have'} not linked an osu! account. Use \`/link\` first.`
                        )]
                    });
                    return;
                }

                osuUsername = dbUser.osu_id;
                mode = modeInput || dbUser.mode;
            }

            // Fetch osu! user data
            const osuUser = await osuAPI.getUser(osuUsername, mode);
            
            if (!osuUser) {
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed('User not found. Please check the username and try again.')]
                });
                return;
            }

            // Create and send embed
            const embed = EmbedUtils.createUserEmbed(osuUser, dbUser);
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in profile command:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed('An error occurred while fetching the profile.')]
                });
            } else {
                await interaction.reply({
                    embeds: [EmbedUtils.createErrorEmbed('An error occurred while fetching the profile.')],
                    ephemeral: true
                });
            }
        }
    }
};

export default profileCommand;
