# osu! Discord Bot

A complete osu! Discord bot built with TypeScript, Bun, and Discord.js. Features comprehensive osu! API integration with slash commands for user profiles, scores, beatmaps, and more.

## Features

### 🔗 Account Management
- **Link osu! accounts** to Discord profiles
- **Change default game modes** (osu!, osu!taiko, osu!catch, osu!mania)
- **Persistent user data** with SQLite database

### 👤 User Commands
- **Profile viewing** with detailed statistics
- **Top plays** with customizable limits
- **Recent plays** with indexing
- **Cross-mode support** for all game modes

### 🎵 Beatmap Commands
- **Beatmap information** by ID
- **Beatmap search** with filters
- **Leaderboards** for any beatmap
- **Score comparison** between users

### ✨ Additional Features
- **No emoji spam** - clean, professional embeds
- **Fast response times** with efficient caching
- **Error handling** with user-friendly messages
- **TypeScript** for better code quality
- **Bun runtime** for superior performance

## Commands

| Command | Description | Usage |
|---------|-------------|--------|
| `/link` | Link your osu! account | `/link username:peppy mode:osu` |
| `/profile` | View user profile | `/profile user:@mention` |
| `/top` | View top plays | `/top limit:5 mode:osu` |
| `/recent` | View recent plays | `/recent index:1` |
| `/mode` | Change default mode | `/mode gamemode:taiko` |
| `/map` | Beatmap info/search | `/map id:123456` |
| `/leaderboard` | Beatmap leaderboard | `/leaderboard beatmap:123456` |
| `/compare` | Compare scores | `/compare beatmap:123456 user:@mention` |
| `/help` | Show all commands | `/help` |

## Setup

### Prerequisites
- [Bun](https://bun.sh/) runtime
- Discord Application with bot token
- osu! API v2 credentials

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo-url>
cd osu-bot
bun install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Deploy commands:**
```bash
bun run deploy
```

4. **Start the bot:**
```bash
# Development (with hot reload)
bun run dev

# Production
bun run start
```

## Environment Variables

```env
# Required
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_application_id
OSU_CLIENT_ID=your_osu_client_id
OSU_CLIENT_SECRET=your_osu_client_secret

# Optional
DEV_GUILD_ID=your_dev_server_id  # For faster dev command deployment
OWNER_ID=your_discord_user_id    # Bot owner permissions
```

## Getting API Credentials

### Discord Bot Token
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application or select existing one
3. Go to "Bot" section
4. Copy the token and client ID

### osu! API Credentials
1. Go to [osu! settings](https://osu.ppy.sh/home/account/edit)
2. Scroll to "OAuth" section
3. Create new OAuth application
4. Use any callback URL (not needed for this bot)
5. Copy client ID and secret

## Development

### Project Structure
```
src/
├── commands/          # Slash command implementations
├── types/             # TypeScript type definitions
├── utils/             # Utility functions and API wrappers
├── index.ts           # Main bot entry point
└── deploy.ts          # Command deployment script
```

### Adding New Commands

1. Create command file in `src/commands/`:
```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SlashCommand } from "@types/commands";

const myCommand: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName('mycommand')
        .setDescription('My new command'),
    
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply('Hello world!');
    }
};

export default myCommand;
```

2. Deploy commands: `bun run deploy`

### Database Schema
```sql
CREATE TABLE users (
    discord_id TEXT PRIMARY KEY,
    osu_id INTEGER NOT NULL,
    osu_username TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'osu',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Performance

- **Bun runtime** - Up to 4x faster than Node.js
- **SQLite database** - Local, fast, zero-config
- **Efficient API calls** - Smart caching and batching
- **Minimal dependencies** - Only essential packages

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Create Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Issues**: Report bugs via GitHub Issues
- **Discord**: Join our support server (link here)
- **Documentation**: Check the osu! API docs

## Acknowledgments

- [osu-web.js](https://github.com/L-Leite/osu-web.js) - osu! API wrapper
- [Discord.js](https://discord.js.org/) - Discord API library
- [Bun](https://bun.sh/) - JavaScript runtime and bundler
