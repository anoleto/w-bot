const axios = require('axios');
const { lastfmApiKey } = require('../config');

module.exports = {
    name: 'lastfm',
    description: "last.fm stuffs",
    commands: {
        lastfm: {
            name: 'lastfm',
            description: 'fetches the latest track or currently playing track of a last.fm user.',
            async run(message, args) {
                const username = args;

                if (!username) {
                    return message.reply('please provide a Last.fm username.');
                }

                const startTime = Date.now();

                try {
                    const response = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${lastfmApiKey}&limit=1&format=json`);

                    if (response.data.error) {
                        return message.reply('could not fetch data for that username. Please check if the username is correct.');
                    }

                    const tracks = response.data.recenttracks.track;
                    if (!tracks || tracks.length === 0) {
                        return message.reply('no recent tracks found for this user.');
                    }

                    const nowPlaying = tracks.find(track => track['@attr'] && track['@attr'].nowplaying);
                    const lastPlayed = tracks[0];

                    const elapsedTime = Date.now() - startTime;

                    let replyMessage = '';

                    if (nowPlaying) {
                        replyMessage += `🎵 **Now Playing:**\n*Track:* ${nowPlaying.name}\n*Artist:* ${nowPlaying.artist['#text']}\n*Album:* ${nowPlaying.album['#text']}\n`;
                    } else if (lastPlayed) {
                        replyMessage += `🎵 **Last Played:**\n*Track:* ${lastPlayed.name}\n*Artist:* ${lastPlayed.artist['#text']}\n*Album:* ${lastPlayed.album['#text']}\n`;
                    }

                    await message.reply(replyMessage);

                } catch (error) {
                    console.error(error);
                    await message.reply('an error occurred while fetching the data from Last.fm.');
                }
            }
        }
    }
};