import { Client, Collection, GatewayIntentBits, Events } from 'discord.js';
import { SlashCommand } from './types/commands';
import { readdirSync } from 'fs';
import { join } from 'path';

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// Create a collection to store commands
const commands = new Collection<string, SlashCommand>();

// Load commands
async function loadCommands() {
    const commandsPath = join(__dirname, 'commands');
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        try {
            const commandModule = await import(filePath);
            const command: SlashCommand = commandModule.default;
            
            if ('data' in command && 'execute' in command) {
                commands.set(command.data.name, command);
                console.log(`Loaded command: ${command.data.name}`);
            } else {
                console.warn(`Command at ${filePath} is missing required "data" or "execute" property.`);
            }
        } catch (error) {
            console.error(`Error loading command at ${filePath}:`, error);
        }
    }
    
    console.log(`Successfully loaded ${commands.size} commands.`);
}

// When the client is ready
client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    console.log(`Bot is in ${client.guilds.cache.size} servers`);
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command:', error);
        
        const errorMessage = {
            content: 'There was an error while executing this command!',
            ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// Handle errors
client.on(Events.Error, error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

// Initialize and start the bot
async function start() {
    try {
        // Load commands first
        await loadCommands();
        
        // Login to Discord
        await client.login(process.env.DISCORD_BOT_TOKEN);
    } catch (error) {
        console.error('Error starting the bot:', error);
        process.exit(1);
    }
}

// Start the bot
start();
