import { SlashCommandBuilder, ChatInputCommandInteraction, User } from "discord.js";
import { SlashCommand } from "@types/commands";
import { DatabaseManager } from "@utils/database";
import osuAPI from "@utils/osu";
import EmbedUtils from "@utils/embeds";
import { GameMode } from "@types/osu";

const topCommand: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('View top plays of an osu! user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Discord user to view top plays for')
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
            option.setName('limit')
                .setDescription('Number of scores to show (1-10)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)),

    async execute(interaction: ChatInputCommandInteraction) {
        const discordUser = interaction.options.getUser('user');
        const usernameInput = interaction.options.getString('username');
        const modeInput = interaction.options.getString('mode') as GameMode;
        const limit = interaction.options.getInteger('limit') || 5;

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

            // Fetch top scores
            const scores = await osuAPI.getUserScores(osuUserId, 'best', mode, limit);
            
            if (scores.length === 0) {
                await interaction.editReply({
                    embeds: [EmbedUtils.createErrorEmbed('No top plays found for this user.')]
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

            // Show first score in detail, then list others
            const embeds = [EmbedUtils.createScoreEmbed(scores[0], 0)];
            
            if (scores.length > 1) {
                let description = `**Top ${scores.length} plays for ${osuUser.username}**\n\n`;
                
                scores.slice(1).forEach((score, index) => {
                    const realIndex = index + 1; // +1 because we skipped the first one
                    const beatmap = score.beatmap!;
                    const beatmapset = score.beatmapset || beatmap.beatmapset!;
                    
                    description += `**#${realIndex + 1}** `;
                    description += `[${beatmapset.artist} - ${beatmapset.title} [${beatmap.version}]](https://osu.ppy.sh/beatmapsets/${beatmapset.id}#osu/${beatmap.id}) `;
                    description += `${osuAPI.formatMods(score.mods)}\n`;
                    description += `${osuAPI.getRankEmoji(score.rank)} **${score.pp?.toFixed(2) || 0}pp** `;
                    description += `${osuAPI.formatAccuracy(score.accuracy)} ${score.max_combo}x\n\n`;
                });

                const listEmbed = EmbedUtils.createSuccessEmbed(description)
                    .setTitle(`Top plays for ${osuUser.username}`)
                    .setThumbnail(osuUser.avatar_url)
                    .setFooter({ text: `Mode: ${osuAPI.getModeEmoji(mode)}` });

                embeds.push(listEmbed);
            }

            await interaction.editReply({ embeds });

        } catch (error) {
            console.error('Error in top command:', error);
            await interaction.editReply({
                embeds: [EmbedUtils.createErrorEmbed('An error occurred while fetching top plays.')]
            });
        }
    }
};

export default topCommand;
