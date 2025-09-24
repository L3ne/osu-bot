import { SlashCommandBuilder, ChatInputCommandInteraction, User } from "discord.js";
import { SlashCommand } from "@types/commands";
import { DatabaseManager } from "@utils/database";
import osuAPI from "@utils/osu";
import EmbedUtils from "@utils/embeds";
import { GameMode } from "@types/osu";

const recentCommand: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName('recent')
        .setDescription('View recent plays of an osu! user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Discord user to view recent plays for')
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
                ))
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('Which recent play to show (1-10)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)),

    async execute(interaction: ChatInputCommandInteraction) {
        const discordUser = interaction.options.getUser('user');
        const usernameInput = interaction.options.getString('username');
        const modeInput = interaction.options.getString('mode') as GameMode;
        const index = (interaction.options.getInteger('index') || 1) - 1; // Convert to 0-based index

        await interaction.deferReply();

        try {
            let osuUserId: number;
            let mode: GameMode = 'osu';
            let dbUser;

            // Determine what user to fetch
            if (usernameInput) {
                // Direct username/ID input
                const osuUser = await osuAPI.getUser(usernameInput);
                if (!osuUser) {
                    await interaction.editReply({
                        embeds: [EmbedUtils.createErrorEmbed('User not found. Please check the username and try again.')]
                    });
                    return;
                }
                osuUserId = osuUser.id;
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

                osuUserId = dbUser.osu_id;
                mode = modeInput || dbUser.mode;
            }

            // Fetch recent scores
            const scores = await osuAPI.getUserScores(osuUserId, 'recent', mode, 10);
            
            if (scores.length === 0) {
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed('No recent plays found for this user.')]
                });
                return;
            }

            if (index >= scores.length) {
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed(`This user only has ${scores.length} recent play${scores.length === 1 ? '' : 's'}.`)]
                });
                return;
            }

            // Get user info for the embed
            const osuUser = await osuAPI.getUser(osuUserId, mode);
            if (!osuUser) {
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed('Error fetching user information.')]
                });
                return;
            }

            // Create score embed
            const score = scores[index];
            const embed = EmbedUtils.createScoreEmbed(score);
            
            // Modify title and description for recent play
            embed.setDescription(`**Recent play #${index + 1}** for **${osuUser.username}**`);
            
            // Add pass/fail status
            const passStatus = score.passed ? 'Completed' : 'Failed';
            embed.addFields([{
                name: 'Status',
                value: passStatus,
                inline: true
            }]);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in recent command:', error);
            await interaction.editReply({
                embeds: [EmbedUtils.createErrorEmbed('An error occurred while fetching recent plays.')]
            });
        }
    }
};

export default recentCommand;
