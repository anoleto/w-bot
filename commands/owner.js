const config = require('../config');

module.exports = {
    name: 'owner',
    description: 'owner-only commands',
    commands: {
        eval: {
            name: 'eval',
            aliases: ['js'],
            description: 'evaluates js code and returns the result (owner-only command)',
            async run(message, args) {
                if (!config.ownerId.includes(message.from)) {
                    return await message.reply('you do not have permission to run this command!');
                }

                try {
                    let result = eval(args);

                    if (result instanceof Promise) result = await result;

                    const output = result === undefined ? 'undefined' : result.toString();
                    const truncatedOutput = output.length > 2000 ? `${output.slice(0, 2000)}...` : output;

                    await message.reply(`\`\`\`\n${truncatedOutput}\n\`\`\``);
                } catch (err) {
                    await message.reply(`error:\n\`\`\`\n${err.message}\n\`\`\``);
                }
            }
        }
    }
};