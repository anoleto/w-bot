const fs = require('fs');
const path = require('path');

class CommandHandler {
    constructor(bot) {
        this.bot = bot;
        this.debug = bot.debug;
        this.commands = new Map();
        this.cogs = {};
    }

    async loadAll() {
        await this.loadCogs();
    }

    async loadCogs() {
        const cogFiles = await fs.promises.readdir(path.join(__dirname, '..', 'commands'));

        for (const file of cogFiles.filter(file => file.endsWith('.js'))) {
            const cogName = file.replace('.js', '');
            try {
                // maybe add category folders..
                const cog = require(`../commands/${file}`);
                this.cogs[cogName] = cog;

                if (this.debug) {
                    console.log(`loaded cog: ${cogName}`);
                }

                this.loadCommands(cog);
            } catch (err) {
                console.error(`failed to load cog ${file}:`, err);
            }
        }
    }

    loadCommands(cog) {
        for (const commandName in cog.commands) {
            const command = cog.commands[commandName];
            if (command && command.run) {
                command.run = command.run.bind(this.bot);
                this.commands.set(command.name, command);

                if (this.debug) console.log(`loaded command: ${command.name}`);
            }
        }
    }

    getCommand(commandName) {
        return [...this.commands.values()].find(cmd => 
            cmd.name === commandName || (cmd.aliases && cmd.aliases.includes(commandName))
        );
    }
}

module.exports = CommandHandler;