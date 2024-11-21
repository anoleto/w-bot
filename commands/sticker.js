const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const config = require('../config');

module.exports = {
    name: 'sticker',
    description: 'sticker stuffs',
    commands: {
        sticker: {
            name: 'sticker',
            description: 'converts an image or gif to a sticker.',
            async run(message) {
                if (!message.hasQuotedMsg && !message.hasMedia) {
                    await message.reply(`*usage:* reply to an image/gif or send an image/gif with ${config.prefix}sticker`);
                    return;
                }

                try {
                    // TODO: put these stupids to a new func
                    let media;
                    
                    if (message.hasQuotedMsg) {
                        const quotedMsg = await message.getQuotedMessage();
                        media = await quotedMsg.downloadMedia();
                    } else {
                        media = await message.downloadMedia();
                    }

                    if (!media.mimetype.startsWith('image/')) {
                        await message.reply('please send a valid image or gif.');
                        return;
                    }

                    const tempDir = path.join(__dirname, '..', '.data');
                    await fsPromises.mkdir(tempDir, { recursive: true });

                    const isGif = media.mimetype === 'image/gif';
                    const fileExtension = isGif ? 'gif' : 'webp';
                    const inputFilename = `input_${Date.now()}.${isGif ? 'gif' : 'png'}`;
                    const outputFilename = `sticker_${Date.now()}.${fileExtension}`;
                    const inputFilepath = path.join(tempDir, inputFilename);
                    const outputFilepath = path.join(tempDir, outputFilename);

                    await fsPromises.writeFile(inputFilepath, media.data, 'base64');

                    if (isGif) {
                        await sharp(inputFilepath, { animated: true })
                            .resize(512, 512, {
                                fit: 'contain',
                                background: { r: 0, g: 0, b: 0, alpha: 0 }
                            })
                            .webp({ quality: 80, nearLossless: true })
                            .toFile(outputFilepath);
                    } else {
                        await sharp(inputFilepath)
                            .resize(512, 512, {
                                fit: 'contain',
                                background: { r: 0, g: 0, b: 0, alpha: 0 }
                            })
                            .webp({ quality: 80 })
                            .toFile(outputFilepath);
                    }

                    const stickerMedia = MessageMedia.fromFilePath(outputFilepath);
                    await message.reply(stickerMedia, undefined, { 
                        sendMediaAsSticker: true 
                    });

                    setTimeout(() => {
                        try {
                            fs.unlinkSync(inputFilepath);
                            fs.unlinkSync(outputFilepath);
                        } catch (unlinkError) {
                            console.warn('could not delete temporary files:', unlinkError);
                        }
                    }, 5000);

                } catch (error) {
                    console.error(error);
                    await message.reply('an error occurred while creating the sticker.');
                }
            }
        }
    }
};