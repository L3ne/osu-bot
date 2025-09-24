import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SlashCommand } from "@types/commands";
import osuAPI from "@utils/osu";
import EmbedUtils from "@utils/embeds";
import { GameMode } from "@types/osu";

const leaderboardCommand: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View leaderboard for a beatmap')
        .addIntegerOption(option =>
            option.setName('beatmap')
                .setDescription('Beatmap ID to view leaderboard for')
                .setRequired(true))
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
            option.setName('limit')
                .setDescription('Number of scores to show (1-10)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)),

    async execute(interaction: ChatInputCommandInteraction) {
        const beatmapId = interaction.options.getInteger('beatmap', true);
        const mode = interaction.options.getString('mode') as GameMode || 'osu';
        const limit = interaction.options.getInteger('limit') || 5;

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

            // Get leaderboard scores
            const scores = await osuAPI.getBeatmapScores(beatmapId, mode, limit);
            
            if (scores.length === 0) {
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed('No scores found for this beatmap.')]
                });
                return;
            }

            const beatmapset = beatmap.beatmapset!;
            
            // Create leaderboard embed
            let description = `**Leaderboard for:** [${beatmapset.artist} - ${beatmapset.title} [${beatmap.version}]](https://osu.ppy.sh/beatmapsets/${beatmapset.id}#osu/${beatmap.id})\n\n`;
            
            scores.forEach((score, index) => {
                const rank = index + 1;
                const user = score.user!;
                
                description += `**#${rank}** [${user.username}](https://osu.ppy.sh/users/${user.id}) `;
                description += `${osuAPI.getRankEmoji(score.rank)} `;
                description += `**${osuAPI.formatNumber(score.score)}** `;
                description += `(${osuAPI.formatAccuracy(score.accuracy)}, ${score.max_combo}x)\n`;
                description += `${osuAPI.formatMods(score.mods)} `;
                if (score.pp) {
                    description += `**${score.pp.toFixed(2)}pp** `;
                }
                description += `*${new Date(score.created_at).toLocaleDateString()}*\n\n`;
            });

            const embed = EmbedUtils.createSuccessEmbed(description)
                .setTitle(`${osuAPI.getModeEmoji(mode)} Leaderboard`)
                .setThumbnail(beatmapset.covers.list)
                .setFooter({ 
                    text: `${beatmap.difficulty_rating.toFixed(2)}★ | ${osuAPI.formatTime(beatmap.total_length)} | ${beatmap.bpm} BPM` 
                });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in leaderboard command:', error);
            await interaction.editReply({
                embeds: [EmbedUtils.createErrorEmbed('An error occurred while fetching the leaderboard.')]
            });
        }
    }
};

export default leaderboardCommand;
