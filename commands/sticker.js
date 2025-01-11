const { MessageMedia } = require('whatsapp-web.js');
const fsPromises = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const config = require('../config');
const { exec } = require('child_process');

async function _prepare() {
    const tempDir = path.join(__dirname, '..', '.data');
    await fsPromises.mkdir(tempDir, { recursive: true });
    return tempDir;
}

async function _save(media, tempDir) {
    const isGif = media.mimetype === 'image/gif';
    const isVideo = media.mimetype.startsWith('video/');
    const inputExtension = isGif ? 'gif' : isVideo ? 'mp4' : 'png';

    const inputFilename = `input_${Date.now()}.${inputExtension}`;
    const outputFilename = `sticker_${Date.now()}.webp`;

    const inp = path.join(tempDir, inputFilename);
    const out = path.join(tempDir, outputFilename);

    await fsPromises.writeFile(inp, media.data, 'base64');

    return { inp, out };
}

async function _convert(mimetype, inputFilepath, outputFilepath) {
    if (mimetype === 'image/gif' || mimetype.startsWith('video/')) {
        await new Promise((resolve, reject) => {
            exec(
                `ffmpeg -i ${inputFilepath} ` +
                `-vf "scale=512:512:force_original_aspect_ratio=decrease,` + 
                `pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" ` +
                `-c:v libwebp -loop 0 -preset default -an -vsync 0 -s 512:512 ` +
                `${outputFilepath}`,

                (error) => 
                    (error ? 
                        reject(error) : 
                        resolve())
            );
        });
    } else {
        await sharp(inputFilepath)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .webp({ quality: 80 })
            .toFile(outputFilepath);
    }
}

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
                    const media = message.hasQuotedMsg
                        ? await (await message.getQuotedMessage()).downloadMedia()
                        : await message.downloadMedia();
                    const tempDir = await _prepare();

                    // input or output file
                    const { inp, out } = await _save(media, tempDir);
                    await _convert(media.mimetype, inp, out);

                    const sticker = MessageMedia.fromFilePath(out);
                    await message.reply(sticker, undefined, { 
                        sendMediaAsSticker: true 
                    });

                    await fsPromises.unlink(inp);
                } catch (error) {
                    console.error(error);
                    await message.reply('an error occurred while creating the sticker.');
                }
            }
        }
    }
};