import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { SlashCommand } from './types/commands';

const commands: any[] = [];

// Load all commands
async function loadCommands() {
    const commandsPath = join(__dirname, 'commands');
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        try {
            const commandModule = await import(filePath);
            const command: SlashCommand = commandModule.default;
            
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
                console.log(`Loaded command: ${command.data.name}`);
            } else {
                console.warn(`Command at ${filePath} is missing required "data" or "execute" property.`);
            }
        } catch (error) {
            console.error(`Error loading command at ${filePath}:`, error);
        }
    }
    
    console.log(`Successfully loaded ${commands.length} commands for deployment.`);
}

// Deploy commands
async function deploy() {
    const token = process.env.DISCORD_BOT_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DEV_GUILD_ID;

    if (!token) {
        throw new Error('DISCORD_BOT_TOKEN is required');
    }

    if (!clientId) {
        throw new Error('DISCORD_CLIENT_ID is required');
    }

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(token);

    try {
        await loadCommands();

        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        let data: any;

        if (guildId) {
            // Deploy to specific guild (for development)
            console.log(`Deploying to guild: ${guildId}`);
            data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );
        } else {
            // Deploy globally (for production)
            console.log('Deploying globally...');
            data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );
        }

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        
        // List deployed commands
        data.forEach((command: any) => {
            console.log(`- ${command.name}: ${command.description}`);
        });

    } catch (error) {
        console.error('Error deploying commands:', error);
        process.exit(1);
    }
}

// Run deployment
deploy().then(() => {
    console.log('Deployment completed successfully!');
    process.exit(0);
}).catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
});
