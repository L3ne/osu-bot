import { EmbedBuilder, Colors } from "discord.js";
import { OsuUser, OsuScore, OsuBeatmap, DatabaseUser } from "../types/osu";
import osuAPI from "./osu";

export class EmbedUtils {
    static createUserEmbed(user: OsuUser, dbUser?: DatabaseUser): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setTitle(`${user.username}`)
            .setURL(`https://osu.ppy.sh/users/${user.id}`)
            .setThumbnail(user.avatar_url);

        if (user.cover_url) {
            embed.setImage(user.cover_url);
        }

        const stats = user.statistics;
        if (stats) {
            embed.addFields([
                {
                    name: 'Rank',
                    value: `Global: #${osuAPI.formatNumber(stats.global_rank || 0)}\nCountry (#${user.country_code}): #${osuAPI.formatNumber(stats.country_rank || 0)}`,
                    inline: true
                },
                {
                    name: 'Performance',
                    value: `PP: ${osuAPI.formatNumber(stats.pp)}\nAccuracy: ${osuAPI.formatAccuracy(stats.hit_accuracy)}`,
                    inline: true
                },
                {
                    name: 'Level',
                    value: `${stats.level.current} (${stats.level.progress.toFixed(1)}%)`,
                    inline: true
                },
                {
                    name: 'Play Stats',
                    value: `Playcount: ${osuAPI.formatNumber(stats.play_count)}\nPlay Time: ${Math.floor(stats.play_time / 3600)}h ${Math.floor((stats.play_time % 3600) / 60)}m`,
                    inline: true
                },
                {
                    name: 'Scores',
                    value: `Total Score: ${osuAPI.formatNumber(stats.total_score)}\nMax Combo: ${osuAPI.formatNumber(stats.maximum_combo)}`,
                    inline: true
                },
                {
                    name: 'Grades',
                    value: `SS: ${stats.grade_counts.ss} | S: ${stats.grade_counts.s}\nA: ${stats.grade_counts.a}`,
                    inline: true
                }
            ]);
        }

        embed.setFooter({
            text: `Mode: ${dbUser ? osuAPI.getModeEmoji(dbUser.mode) : 'osu!'} | ID: ${user.id}`
        });

        return embed;
    }

    static createScoreEmbed(score: OsuScore, index?: number): EmbedBuilder {
        const beatmap = score.beatmap!;
        const beatmapset = score.beatmapset || beatmap.beatmapset!;
        
        const embed = new EmbedBuilder()
            .setColor(this.getRankColor(score.rank))
            .setTitle(`${beatmapset.artist} - ${beatmapset.title} [${beatmap.version}]`)
            .setURL(`https://osu.ppy.sh/beatmapsets/${beatmapset.id}#osu/${beatmap.id}`)
            .setThumbnail(beatmapset.covers.list);

        if (index !== undefined) {
            embed.setDescription(`**#${index + 1}** top play`);
        }

        const stats = score.statistics;
        embed.addFields([
            {
                name: 'Score Info',
                value: [
                    `Score: ${osuAPI.formatNumber(score.score)}`,
                    `Combo: ${osuAPI.formatNumber(score.max_combo)}x/${osuAPI.formatNumber(beatmap.count_circles + beatmap.count_sliders)}x`,
                    `Accuracy: ${osuAPI.formatAccuracy(score.accuracy)}`,
                    `Grade: ${osuAPI.getRankEmoji(score.rank)}`
                ].join('\n'),
                inline: true
            },
            {
                name: 'Hit Statistics',
                value: [
                    `300: ${osuAPI.formatNumber(stats.count_300)}`,
                    `100: ${osuAPI.formatNumber(stats.count_100)}`,
                    `50: ${osuAPI.formatNumber(stats.count_50)}`,
                    `Miss: ${osuAPI.formatNumber(stats.count_miss)}`
                ].join('\n'),
                inline: true
            },
            {
                name: 'Beatmap Info',
                value: [
                    `Length: ${osuAPI.formatTime(beatmap.total_length)}`,
                    `BPM: ${beatmap.bpm}`,
                    `Stars: ${beatmap.difficulty_rating.toFixed(2)}`,
                    `AR: ${beatmap.ar} | OD: ${beatmap.accuracy} | CS: ${beatmap.cs}`
                ].join('\n'),
                inline: true
            }
        ]);

        if (score.pp) {
            embed.addFields([{
                name: 'Performance',
                value: `**${score.pp.toFixed(2)}pp**${score.weight ? ` (${score.weight.pp.toFixed(2)}pp weighted)` : ''}`,
                inline: false
            }]);
        }

        if (score.mods.length > 0) {
            embed.addFields([{
                name: 'Mods',
                value: osuAPI.formatMods(score.mods),
                inline: true
            }]);
        }

        embed.setFooter({
            text: `Played ${new Date(score.created_at).toLocaleDateString()}`
        });

        return embed;
    }

    static createBeatmapEmbed(beatmap: OsuBeatmap): EmbedBuilder {
        const beatmapset = beatmap.beatmapset!;
        
        const embed = new EmbedBuilder()
            .setColor(Colors.Purple)
            .setTitle(`${beatmapset.artist} - ${beatmapset.title}`)
            .setDescription(`**[${beatmap.version}]** mapped by **${beatmapset.creator}**`)
            .setURL(`https://osu.ppy.sh/beatmapsets/${beatmapset.id}#osu/${beatmap.id}`)
            .setThumbnail(beatmapset.covers.list)
            .addFields([
                {
                    name: 'Difficulty',
                    value: [
                        `Stars: ${beatmap.difficulty_rating.toFixed(2)}`,
                        `AR: ${beatmap.ar} | OD: ${beatmap.accuracy}`,
                        `CS: ${beatmap.cs} | HP: ${beatmap.drain}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: 'Timing',
                    value: [
                        `Length: ${osuAPI.formatTime(beatmap.total_length)}`,
                        `BPM: ${beatmap.bpm}`,
                        `Objects: ${beatmap.count_circles + beatmap.count_sliders + beatmap.count_spinners}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: 'Statistics',
                    value: [
                        `Playcount: ${osuAPI.formatNumber(beatmap.playcount)}`,
                        `Pass Rate: ${((beatmap.passcount / beatmap.playcount) * 100).toFixed(1)}%`,
                        `Status: ${beatmapset.status}`
                    ].join('\n'),
                    inline: true
                }
            ])
            .setFooter({
                text: `Beatmap ID: ${beatmap.id} | Beatmapset ID: ${beatmapset.id}`
            });

        if (beatmapset.covers.cover) {
            embed.setImage(beatmapset.covers.cover);
        }

        return embed;
    }

    static createErrorEmbed(message: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle('Error')
            .setDescription(message);
    }

    static createSuccessEmbed(message: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('Success')
            .setDescription(message);
    }

    private static getRankColor(rank: string): number {
        switch (rank) {
            case 'XH':
            case 'X':
                return Colors.Gold;
            case 'SH':
            case 'S':
                return Colors.Yellow;
            case 'A':
                return Colors.Green;
            case 'B':
                return Colors.Blue;
            case 'C':
                return Colors.Purple;
            case 'D':
                return Colors.Red;
            default:
                return Colors.Grey;
        }
    }
}

export default EmbedUtils;
