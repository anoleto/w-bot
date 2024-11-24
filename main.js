const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const config = require('./config');

class Bot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: 'clientId' }),
            puppeteer: {
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            }
        });
        this.cogs = {};
        this.commands = new Map();
        this.prefix = config.prefix || '!';
        this.debug = config.debug || false;
    }

    async loadCogs() {
        const cogFiles = await fs.promises.readdir(path.join(__dirname, 'commands'));

        for (const file of cogFiles.filter(file => file.endsWith('.js'))) {
            const cogName = file.replace('.js', '');
            try {
                // maybe add category folders..
                const cog = require(`./commands/${file}`);
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
                command.run = command.run.bind(this);
                this.commands.set(command.name, command);

                if (this.debug) console.log(`loaded command: ${command.name}`);
            }
        }
    }

    async start() {
        await this.loadCogs();

        this.client.on('qr', qr => {
            qrcode.generate(qr, { small: true });
            console.log('scan the QR code!');
        });

        this.client.on('authenticated', () => {
            console.log('authenticated successfully.');
        });

        this.client.on('ready', () => {
            const timestamp = new Date().toLocaleString();
            // should i make it look cooler more?
            console.log(`
                ==========================
                       Client Ready
                ==========================
                
                client info:
                - name     : ${this.client.info.pushname}
                - id       : ${this.client.info.wid._serialized}
                - platform : ${this.client.info.platform}

                ${timestamp} now connected!
                
                ==========================
            `);
        });

        this.client.on('message_create', async (message) => {
            const startTime = Date.now();
            const messageContent = (message.body && typeof message.body === 'string') ? message.body.trim() : '';

            if (messageContent.startsWith(this.prefix)) {
                if (this.debug) {
                    console.log('received message:', message.body);
                }

                const [commandName, ...args] = messageContent.slice(this.prefix.length).trim().split(/\s+/);

                const command = [...this.commands.values()].find(cmd => 
                    cmd.name === commandName || (cmd.aliases && cmd.aliases.includes(commandName))
                );

                if (command) {
                    if (command.owner && !config.ownerId.includes(message.from)) {
                        return await message.reply('you do not have permission to run this command!');
                    }

                    try {
                        await command.run(message, args.join(' ').trim());
                    } catch (err) {
                        console.error(`error executing command ${commandName}:`, err);
                    }
                }

                if (this.debug) {
                    console.log(`processing time: ${Date.now() - startTime}ms`);
                }
            }
        });

        await this.client.initialize();
    }
}

const bot = new Bot();
bot.start().catch(err => console.error('err starting bot:', err));