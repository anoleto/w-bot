const path = require('path');
const fs = require('fs');

module.exports = {
    name: 'owner',
    description: 'owner-only commands',
    commands: {
        eval: {
            name: 'eval',
            aliases: ['js'],
            description: 'evaluates js code and returns the result',
            owner: true,
            async run(message, args) {
                try {
                    let result = eval(args);

                    if (result instanceof Promise) result = await result;

                    const output = result === undefined ? 'undefined' : result.toString();
                    const truncatedOutput = output.length > 2000 ? `${output.slice(0, 2000)}...` : output;

                    await message.reply(`\`\`\`\n${truncatedOutput}\n\`\`\``);
                    await message.react('✅')
                } catch (err) {
                    await message.reply(`error:\n\`\`\`\n${err.message}\n\`\`\``);
                    await message.react('❌')
                }
            }
        },
        loadcog: {
            name: 'loadcog',
            description: 'load a cog module',
            owner: true,
            async run(message, args) {
                if (!args) {
                    return await message.reply('please specify a cog to load.');
                }

                const cogName = args.toLowerCase();
                const cogPath = path.join(__dirname, `${cogName}.js`);

                try {
                    delete require.cache[require.resolve(cogPath)];
                    
                    const cog = require(cogPath);
                    this.cogs[cogName] = cog;
                    
                    this.loadCommands(cog);
                    
                    await message.reply(`successfully loaded cog: ${cogName}`);
                } catch (err) {
                    console.error(`failed to load cog ${cogName}:`, err);
                    await message.reply(`failed to load cog ${cogName}: ${err.message}`);
                }
            }
        },

        reloadcog: {
            name: 'reloadcog',
            description: 'reload a cog module',
            owner: true,
            async run(message, args) {
                if (!args) {
                    return await message.reply('please specify a cog to reload.');
                }

                const cogName = args.toLowerCase();
                
                if (!this.cogs[cogName]) {
                    return await message.reply(`cog ${cogName} is not loaded.`);
                }

                const cogPath = path.join(__dirname, `${cogName}.js`);

                try {
                    const oldCog = this.cogs[cogName];
                    for (const cmdName in oldCog.commands) {
                        this.commands.delete(oldCog.commands[cmdName].name);
                    }

                    delete require.cache[require.resolve(cogPath)];
                    const newCog = require(cogPath);
                    
                    this.cogs[cogName] = newCog;
                    this.loadCommands(newCog);
                    
                    await message.reply(`successfully reloaded cog: ${cogName}`);
                } catch (err) {
                    console.error(`failed to reload cog ${cogName}:`, err);
                    await message.reply(`failed to reload cog ${cogName}: ${err.message}`);
                }
            }
        },

        stopcog: {
            name: 'stopcog',
            description: 'stop and unload a cog module',
            owner: true,
            async run(message, args) {
                if (!args) {
                    return await message.reply('please specify a cog to stop.');
                }

                const cogName = args.toLowerCase();
                
                if (!this.cogs[cogName]) {
                    return await message.reply(`cog ${cogName} is not loaded.`);
                }

                try {
                    const cog = this.cogs[cogName];
                    for (const cmdName in cog.commands) {
                        this.commands.delete(cog.commands[cmdName].name);
                    }

                    delete this.cogs[cogName];
                    delete require.cache[require.resolve(path.join(__dirname, `${cogName}.js`))];
                    
                    await message.reply(`successfully stopped cog: ${cogName}`);
                } catch (err) {
                    console.error(`failed to stop cog ${cogName}:`, err);
                    await message.reply(`failed to stop cog ${cogName}: ${err.message}`);
                }
            }
        }
    }
};