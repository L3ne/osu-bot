import { SlashCommandBuilder, ChatInputCommandInteraction, User } from "discord.js";
import { SlashCommand } from "@types/commands";
import { DatabaseManager } from "@utils/database";
import osuAPI from "@utils/osu";
import EmbedUtils from "@utils/embeds";
import { GameMode } from "@types/osu";

const compareCommand: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName('compare')
        .setDescription('Compare scores on a beatmap')
        .addIntegerOption(option =>
            option.setName('beatmap')
                .setDescription('Beatmap ID to compare scores on')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Discord user to compare with')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('username')
                .setDescription('osu! username or user ID to compare with')
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
        const beatmapId = interaction.options.getInteger('beatmap', true);
        const discordUser = interaction.options.getUser('user');
        const usernameInput = interaction.options.getString('username');
        const modeInput = interaction.options.getString('mode') as GameMode;

        await interaction.deferReply();

        try {
            // Get beatmap info first
            const beatmap = await osuAPI.getBeatmap(beatmapId);
            if (!beatmap) {
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed('Beatmap not found. Please check the ID and try again.')]
                });
                return;
            }

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

            // Get all scores from the user on this beatmap
            const allScores = await osuAPI.getBeatmapScores(beatmapId, mode, 50);
            const userScores = allScores.filter(score => score.user?.id === osuUserId);

            if (userScores.length === 0) {
                const osuUser = await osuAPI.getUser(osuUserId);
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed(`${osuUser?.username || 'User'} has no scores on this beatmap.`)]
                });
                return;
            }

            // Get the best score
            const bestScore = userScores.reduce((best, current) => 
                (current.score > best.score) ? current : best
            );

            // Create embed for the score
            const embed = EmbedUtils.createScoreEmbed(bestScore);
            
            // Add comparison info
            embed.setDescription(`**Best score** on this beatmap by **${bestScore.user?.username}**`);
            
            // Find position on leaderboard
            const scorePosition = allScores.findIndex(score => score.id === bestScore.id);
            if (scorePosition !== -1) {
                embed.addFields([{
                    name: 'Leaderboard Position',
                    value: `#${scorePosition + 1}`,
                    inline: true
                }]);
            }

            // Show if user has multiple scores
            if (userScores.length > 1) {
                embed.addFields([{
                    name: 'Total Plays',
                    value: `${userScores.length} play${userScores.length === 1 ? '' : 's'} on this map`,
                    inline: true
                }]);
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in compare command:', error);
            await interaction.editReply({
                embeds: [EmbedUtils.createErrorEmbed('An error occurred while comparing scores.')]
            });
        }
    }
};

export default compareCommand;
