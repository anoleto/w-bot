const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
    name: 'help',
    description: 'displays a list of all available commands.',
    commands: {
        help: {
            name: 'help',
            description: 'displays available commands in the bot.',
            async run(message) {
                const commandFiles = await fs.promises.readdir(path.join(__dirname, '../commands'));
                const commandList = [];

                for (const file of commandFiles.filter(file => file.endsWith('.js'))) {
                    const cogName = path.basename(file, '.js');
                    try {
                        // TODO: improve these
                        const cog = require(path.join(__dirname, '../commands', file));

                        for (const commandName in cog.commands) {
                            const command = cog.commands[commandName];
                            commandList.push(
                                `${config.prefix}${command.name}${
                                    command.aliases ? ` (${command.aliases.join(', ')})` : ''
                                }: ${command.description || 'no description available.'}`
                            );
                        }
                    } catch (err) {
                        console.error(`failed to load cog ${cogName}:`, err);
                    }
                }

                const helpMessage = commandList.length > 0
                    ? `here are the available commands:\n\n${commandList.join('\n')}\n\nto run a command, type "${config.prefix}<command_name>."`
                    : 'no commands available.';

                await message.reply(helpMessage);
            }
        }
    }
};