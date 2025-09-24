import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SlashCommand } from "@types/commands";
import EmbedUtils from "@utils/embeds";

const helpCommand: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands'),

    async execute(interaction: ChatInputCommandInteraction) {
        const embed = EmbedUtils.createSuccessEmbed('')
            .setTitle('osu! Bot Commands')
            .setDescription('Here are all available commands:')
            .addFields([
                {
                    name: 'Account Management',
                    value: [
                        '`/link <username> [mode]` - Link your osu! account',
                        '`/mode <gamemode>` - Change your default game mode'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: 'User Information',
                    value: [
                        '`/profile [user] [username] [mode]` - View user profile',
                        '`/top [user] [username] [mode] [limit]` - View top plays',
                        '`/recent [user] [username] [mode] [index]` - View recent plays'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: 'Beatmap Information',
                    value: [
                        '`/map [id] [search] [mode]` - Get beatmap info or search',
                        '`/leaderboard <beatmap> [mode] [limit]` - View beatmap leaderboard',
                        '`/compare <beatmap> [user] [username] [mode]` - Compare scores on beatmap'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: 'Game Modes',
                    value: [
                        'osu! - Standard clicking circles',
                        'osu!taiko - Drum rhythm game',
                        'osu!catch - Catch falling fruits', 
                        'osu!mania - Piano-style rhythm game'
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ 
                text: 'Use /help to see this message again. Parameters in [] are optional, <> are required.' 
            });

        await interaction.reply({ embeds: [embed] });
    }
};

export default helpCommand;
