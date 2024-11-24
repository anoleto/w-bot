const os = require('os');

module.exports = {
    name: 'info',
    description: 'system and bot information',
    commands: {
        info: {
            name: 'info',
            description: 'displays general information about the bot and system.',
            async run(message) {
                const cpu = os.cpus()[0].model;
                const totalMemory = (os.totalmem() / 1024 ** 3).toFixed(2);
                const freeMemory = (os.freemem() / 1024 ** 3).toFixed(2);

                const uptimeI = os.uptime();
                const days = Math.floor(uptimeI / (60 * 60 * 24));
                const hours = Math.floor((uptimeI % (60 * 60 * 24)) / (60 * 60));
                const minutes = Math.floor((uptimeI % (60 * 60)) / 60);
                const uptime = `${days} days, ${hours} hours, ${minutes} minutes`;

                const platform = os.platform();
                const arch = os.arch();

                const infoMessage = `
**general Information:**
dis a testing bot, uses whatsapp-web.js for the bot.
still learning js tho.. tyoe shii.

**system Information:**
- CPU: ${cpu}
- RAM: ${freeMemory}GB free / ${totalMemory}GB total
- Uptime: ${uptime}
- Platform: ${platform}
- Architecture: ${arch}

**links:**
- support me on ko-fi: https://ko-fi.com/anolet
- github: https://github.com/anoleto
- source code: https://github.com/anoleto/w-bot
`.trim();

                await message.reply(infoMessage);
            }
        }
    }
};
