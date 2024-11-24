const fs = require('fs').promises;
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const isValidUrl = (url) => {
    try { return Boolean(new URL(url)); }
    catch (e) { return false; }
};

const downloadYouTube = async (url) => {
    try {
        const outputPath = path.join(__dirname, '../.data', `yt-${Date.now()}.mp4`);
        const command = `yt-dlp -o "${outputPath}" "${url}"`;
        await execAsync(command);

        return outputPath;
    } catch (error) {
        throw new Error('failed to download YouTube video');
    }
};

const downloadTikTok = async (url) => {
    try {
        const outputPath = path.join(__dirname, '../.data', `tt-${Date.now()}.mp4`);
        const command = `yt-dlp -f "h264_540p_894688-1" -o "${outputPath}" "${url}"`;
        await execAsync(command);

        return outputPath;
    } catch (error) {
        throw new Error('failed to download tiktok video');
    }
};

module.exports = {
    name: 'downloader',
    description: "to download videos or audio from youtube or tiktok (Not finished)",
    commands: {
        download: {
            name: 'download',
            aliases: ['dl'],
            description: 'download video from tiktok or youtube',
            async run(message, args) {
                if (!args) return message.reply('please provide a video URL.');

                const url = args.trim();
                if (!isValidUrl(url)) return message.reply('please provide a valid URL.');

                const replyMsg = await message.reply('processing your request... gonna take some time');

                try {
                    let filePath;

                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                        filePath = await downloadYouTube(url);
                    } else if (url.includes('tiktok.com')) {
                        filePath = await downloadTikTok(url);
                    } else {
                        return message.reply('unsupported platform. Only tiktok and youtube are supported.');
                    }

                    const media = MessageMedia.fromFilePath(filePath);
                    await message.reply(media, undefined, { caption: 'here is your video!' });
                    await fs.unlink(filePath);
                    await replyMsg.delete(true);
                } catch (error) {
                    console.error(error);
                    await replyMsg.reply('failed to download video. please try again later.');
                }
            }
        }
    }
};