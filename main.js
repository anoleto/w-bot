const { Client, LocalAuth } = require('whatsapp-web.js');
const config = require('./config');
const EventHandler = require('./handlers/events');
const CommandHandler = require('./handlers/commands');

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

        this.eventHandler = new EventHandler(this);
        this.commandHandler = new CommandHandler(this);
    }

    async start() {
        await this.commandHandler.loadAll();
        this.eventHandler.initialize();
        await this.client.initialize();
    }
}

const bot = new Bot();
bot.start().catch(err => console.error('err starting bot:', err));