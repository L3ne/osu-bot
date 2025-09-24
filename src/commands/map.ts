import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SlashCommand } from "@types/commands";
import osuAPI from "@utils/osu";
import EmbedUtils from "@utils/embeds";
import { GameMode } from "@types/osu";

const mapCommand: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName('map')
        .setDescription('Get information about a beatmap')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('Beatmap ID')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Search for beatmaps')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Game mode for search')
                .setRequired(false)
                .addChoices(
                    { name: 'osu!', value: 'osu' },
                    { name: 'osu!taiko', value: 'taiko' },
                    { name: 'osu!catch', value: 'fruits' },
                    { name: 'osu!mania', value: 'mania' }
                )),

    async execute(interaction: ChatInputCommandInteraction) {
        const beatmapId = interaction.options.getInteger('id');
        const searchQuery = interaction.options.getString('search');
        const mode = interaction.options.getString('mode') as GameMode || 'osu';

        if (!beatmapId && !searchQuery) {
            await interaction.reply({
                embeds: [EmbedUtils.createErrorEmbed('Please provide either a beatmap ID or search query.')]
            });
            return;
        }

        await interaction.deferReply();

        try {
            if (beatmapId) {
                // Get specific beatmap by ID
                const beatmap = await osuAPI.getBeatmap(beatmapId);
                
                if (!beatmap) {
                    await interaction.editReply({
                        embeds: [EmbedUtils.createErrorEmbed('Beatmap not found. Please check the ID and try again.')]
                    });
                    return;
                }

                const embed = EmbedUtils.createBeatmapEmbed(beatmap);
                await interaction.editReply({ embeds: [embed] });

            } else if (searchQuery) {
                // Search for beatmaps
                const beatmapsets = await osuAPI.searchBeatmaps(searchQuery, mode, 5);
                
                if (beatmapsets.length === 0) {
                    await interaction.editReply({
                        embeds: [EmbedUtils.createErrorEmbed('No beatmaps found for your search query.')]
                    });
                    return;
                }

                // Show search results
                let description = `**Search results for:** \`${searchQuery}\`\n\n`;
                
                beatmapsets.forEach((beatmapset, index) => {
                    description += `**${index + 1}.** [${beatmapset.artist} - ${beatmapset.title}](https://osu.ppy.sh/beatmapsets/${beatmapset.id})\n`;
                    description += `Mapped by **${beatmapset.creator}** | Status: ${beatmapset.status}\n`;
                    
                    // Show difficulty range if available
                    if (beatmapset.beatmaps && beatmapset.beatmaps.length > 0) {
                        const difficulties = beatmapset.beatmaps
                            .filter((b: any) => b.mode === mode)
                            .map((b: any) => b.difficulty_rating)
                            .sort((a: number, b: number) => a - b);
                        
                        if (difficulties.length > 0) {
                            const minDiff = difficulties[0].toFixed(2);
                            const maxDiff = difficulties[difficulties.length - 1].toFixed(2);
                            description += `Difficulties: ${minDiff}★ - ${maxDiff}★ (${difficulties.length} diffs)\n`;
                        }
                    }
                    
                    description += '\n';
                });

                const embed = EmbedUtils.createSuccessEmbed(description)
                    .setTitle('Beatmap Search Results')
                    .setFooter({ text: `Mode: ${osuAPI.getModeEmoji(mode)} | Use /map id:<id> for detailed info` });

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error in map command:', error);
            await interaction.editReply({
                embeds: [EmbedUtils.createErrorEmbed('An error occurred while fetching beatmap information.')]
            });
        }
    }
};

export default mapCommand;
