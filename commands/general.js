const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    name: 'general',
    description: 'General commands',
    commands: {
        avatar: {
            name: 'avatar',
            aliases: ['av'],
            description: "get user's avatar",
            async run(message) {
                try {
                    const userId = (message.mentionedIds[0] || message.from).includes('@c.us')
                        ? message.mentionedIds[0] || message.from
                        : `${message.mentionedIds[0] || message.from}@c.us`;

                    const contact = await message.client.getContactById(userId);
                    const pfp = await contact.getProfilePicUrl();

                    if (pfp) {
                        const { data, status } = await axios.get(pfp, { responseType: 'arraybuffer' });

                        if (status === 200) {
                            const filename = `avatar_${Date.now()}.jpg`;
                            const filePath = path.join(__dirname, '..', '.data', filename);

                            await fs.mkdir(path.join(__dirname, '..', '.data'), { recursive: true });
                            await fs.writeFile(filePath, data);

                            const media = MessageMedia.fromFilePath(filePath);
                            await message.reply(media, undefined, { caption: 'here is your avatar!' });

                            await fs.unlink(filePath);
                        } else {
                            console.error(status);
                            await message.reply('an error occurred while fetching the avatar image.');
                        }
                    } else {
                        const name = contact.pushname || 'this user';
                        await message.reply(`${name} does not have an avatar set.`);
                    }
                } catch (error) {
                    console.error(error);
                    await message.reply('an error occurred while fetching the avatar.');
                }
            }
        }
    }
};