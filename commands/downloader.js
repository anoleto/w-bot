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

const _download = async (url, isAudio = false, platform = 'yt') => {
    try {
        const ext = isAudio ? 'mp3' : 'mp4';
        const prefix = platform === 'tt' ? 'tt' : 'yt';
        const outputPath = path.join(__dirname, '../.data', `${prefix}-${Date.now()}.${ext}`);

        // requires ffmpeg
        const options = isAudio ? '-x --audio-format mp3' : platform === 'tt' ? '-S "vcodec:h264"' : '';
        const command = `yt-dlp ${options} -o "${outputPath}" "${url}"`;

        await execAsync(command);
        return outputPath;
    } catch {
        throw new Error(`failed to download ${platform === 'tt' ? 'TikTok' : 'YouTube'} ${isAudio ? 'audio' : 'video'}`);
    }
};

module.exports = {
    name: 'downloader',
    description: "to download videos or audio from youtube or tiktok",
    commands: {
        download: {
            name: 'download',
            aliases: ['dl'],
            description: 'download video from tiktok or youtube, add --audio or --a argument to download the audio',
            async run(message, args) {
                if (!args) return message.reply('please provide a video URL.');

                const url = args.trim().split(' ')[0];
                const isAudio = args.trim().includes('--audio' || '--a');
                if (!isValidUrl(url)) return message.reply('please provide a valid URL.');

                const replyMsg = await message.reply('processing your request... gonna take some time');
                const strt = Date.now();
                try {
                    let filePath;

                    // TODO: add support for other media platforms
                    // like instagram, twitter, etc.
                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                        filePath = await _download(url, isAudio, 'yt');
                    } else if (url.includes('tiktok.com')) {
                        filePath = await _download(url, isAudio, 'tt');
                    } else {
                        return message.reply('unsupported platform. Only tiktok and youtube are supported.');
                    }

                    const media = MessageMedia.fromFilePath(filePath);
                    await message.reply(media, undefined, { caption: `here is your ${isAudio ? 'audio' : 'video'}! download time: ${(Date.now() - strt) / 1000}s` });
                    await replyMsg.delete(true);
                } catch (error) {
                    console.error(error);
                    await replyMsg.reply('failed to download video. please try again later.');
                }
            }
        }
    }
};