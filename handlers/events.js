const qrcode = require('qrcode-terminal');
const { Events } = require('whatsapp-web.js');
const config = require('../config');

class EventHandler {
    constructor(bot) {
        this.bot = bot;
        this.debug = bot.debug;
    }

    initialize() {
        this._qr();
        this._auth();
        this._ready();
        this._message_create();
        this._message_revoked();
    }

    _qr() {
        this.bot.client.on(Events.qr, qr => {
            qrcode.generate(qr, { small: true });
            console.log('scan the QR code!');
        });
    }

    _auth() {
        this.bot.client.on(Events.AUTHENTICATED, () => {
            console.log('authenticated successfully.');
        });
    }

    _ready() {
        this.bot.client.on(Events.READY, () => {
            const timestamp = new Date().toLocaleString();
            // should i make it look cooler more?
            console.log(`
                ==========================
                       Client Ready
                ==========================
                
                client info:
                - name     : ${this.bot.client.info.pushname}
                - id       : ${this.bot.client.info.wid._serialized}
                - platform : ${this.bot.client.info.platform}

                ${timestamp} now connected!
                
                ==========================
            `);
        });
    }

    _message_create() {
        this.bot.client.on(Events.MESSAGE_CREATE, async (message) => {
            const startTime = Date.now();
            const messageContent = (message.body && typeof message.body === 'string') ? message.body.trim() : '';

            if (messageContent.startsWith(this.bot.prefix)) {
                if (this.debug) {
                    console.log('received message:', message.body);
                }

                const [commandName, ...args] = messageContent.slice(this.bot.prefix.length).trim().split(/\s+/);
                const command = this.bot.commandHandler.getCommand(commandName);

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
    }

    _message_revoked() {
        this.bot.client.on(Events.MESSAGE_REVOKED_EVERYONE, async (message) => {
            if (this.debug) console.log('message revoked:', message);
        });
    }
}

module.exports = EventHandler;