const axios = require('axios');
const { lastfmApiKey } = require('../config');

const validPeriods = ['overall', '7day', '1month', '3month', '6month', '12month'];

const lastfmAPI = {
    async getRecentTracks(username, limit = 1) {
        return axios.get('http://ws.audioscrobbler.com/2.0/', {
            params: {
                method: 'user.getrecenttracks',
                user: username,
                api_key: lastfmApiKey,
                limit,
                format: 'json'
            }
        });
    },

    async getUserInfo(username) {
        return axios.get('http://ws.audioscrobbler.com/2.0/', {
            params: {
                method: 'user.getinfo',
                user: username,
                api_key: lastfmApiKey,
                format: 'json'
            }
        });
    },

    async getTopArtists(username, period = 'overall', limit = 10) {
        return axios.get('http://ws.audioscrobbler.com/2.0/', {
            params: {
                method: 'user.gettopartists',
                user: username,
                api_key: lastfmApiKey,
                limit,
                format: 'json',
                period: period
            }
        });
    },

    async getTopAlbums(username, period = 'overall', limit = 10) {
        return axios.get('http://ws.audioscrobbler.com/2.0/', {
            params: {
                method: 'user.gettopalbums',
                user: username,
                api_key: lastfmApiKey,
                limit,
                format: 'json',
                period: period
            }
        });
    },

    async getTopTracks(username, period = 'overall', limit = 10) {
        return axios.get('http://ws.audioscrobbler.com/2.0/', {
            params: {
                method: 'user.gettoptracks',
                user: username,
                api_key: lastfmApiKey,
                limit,
                format: 'json',
                period: period
            }
        });
    }
};

const validateUsername = (message, username) => {
    if (!username) {
        message.reply('please provide a last.fm username.');
        return false;
    }
    return true;
};

module.exports = {
    name: 'lastfm',
    description: "last.fm stuffs",
    commands: {
        lastfm: {
            name: 'lastfm',
            aliases: ['fm', 'np'],
            description: 'fetches the latest track or currently playing track of a last.fm user.',
            async run(message, args) {
                const username = args;
                if (!validateUsername(message, username)) return;

                try {
                    const [recentTracksRes, userInfoRes] = await Promise.all([
                        lastfmAPI.getRecentTracks(username),
                        lastfmAPI.getUserInfo(username)
                    ]);

                    const tracks = recentTracksRes.data.recenttracks.track;
                    if (!tracks?.length) {
                        return message.reply('no recent tracks found for this user.');
                    }

                    const nowPlaying = tracks.find(track => track['@attr']?.nowplaying);
                    const lastPlayed = tracks[0];
                    const totalScrobbles = userInfoRes.data.user.playcount;

                    let replyMessage = '';

                    if (nowPlaying) {
                        replyMessage += `🎵 **Now Playing:**\n*Track:* ${nowPlaying.name}\n*Artist:* ${nowPlaying.artist['#text']}\n*Album:* ${nowPlaying.album['#text']}\n`;
                    } else if (lastPlayed) {
                        replyMessage += `🎵 **Last Played:**\n*Track:* ${lastPlayed.name}\n*Artist:* ${lastPlayed.artist['#text']}\n*Album:* ${lastPlayed.album['#text']}\n`;
                    }

                    replyMessage += `**Total Scrobbles:** ${Number(totalScrobbles).toLocaleString()}`;

                    await message.reply(replyMessage);

                } catch (error) {
                    console.error(error);
                    // XXX: every error might be wrong username
                    await message.reply('an error occurred while fetching the data from Last.fm, maybe wrong username?');
                }
            }
        },
        topartists: {
            name: 'topartists',
            aliases: ['ta'],
            description: 'shows top artists for a last.fm user. usage: !topartists <username> [period]',
            async run(message, args) {
                const [username, period = 'overall'] = args.split(' ');
                if (!validateUsername(message, username)) return;

                if (!validPeriods.includes(period)) {
                    return message.reply(`invalid period. valid periods are: ${validPeriods.join(', ')}`);
                }

                try {
                    const response = await lastfmAPI.getTopArtists(username, period);
                    const artists = response.data.topartists.artist;
                    
                    if (!artists?.length) {
                        return message.reply('no top artists found for this user.');
                    }

                    let replyMessage = `👤 **Top Artists for ${username}** (${period}):\n`;
                    artists.forEach((artist, index) => {
                        replyMessage += `${index + 1}. ${artist.name} (${artist.playcount} plays)\n`;
                    });

                    await message.reply(replyMessage);

                } catch (error) {
                    console.error(error);
                    await message.reply('an error occurred while fetching the data from Last.fm, maybe wrong username?');
                }
            }
        },
        topalbums: {
            name: 'topalbums',
            aliases: ['tal'],
            description: 'shows top albums for a Last.fm user. Usage: !topalbums <username> [period]',
            async run(message, args) {
                const [username, period = 'overall'] = args.split(' ');
                if (!validateUsername(message, username)) return;

                if (!validPeriods.includes(period)) {
                    return message.reply(`invalid period. valid periods are: ${validPeriods.join(', ')}`);
                }

                try {
                    const response = await lastfmAPI.getTopAlbums(username, period);
                    const albums = response.data.topalbums.album;

                    if (!albums?.length) {
                        return message.reply('no top albums found for this user.');
                    }

                    let replyMessage = `💿 **Top Albums for ${username}** (${period}):\n`;
                    albums.forEach((album, index) => {
                        replyMessage += `${index + 1}. ${album.artist.name} - ${album.name} (${album.playcount} plays)\n`;
                    });

                    await message.reply(replyMessage);

                } catch (error) {
                    console.error(error);
                    await message.reply('an error occurred while fetching the data from Last.fm, maybe wrong username?');
                }
            }
        },
        toptracks: {
            name: 'toptracks',
            aliases: ['tt'],
            description: 'shows top tracks for a last.fm user. usage: !toptracks <username> [period]',
            async run(message, args) {
                const [username, period = 'overall'] = args.split(' ');
                if (!validateUsername(message, username)) return;

                if (!validPeriods.includes(period)) {
                    return message.reply(`invalid period. Valid periods are: ${validPeriods.join(', ')}`);
                }

                try {
                    const response = await lastfmAPI.getTopTracks(username, period);
                    const tracks = response.data.toptracks.track;

                    if (!tracks?.length) {
                        return message.reply('no top tracks found for this user.');
                    }

                    let replyMessage = `🎵 **Top Tracks for ${username}** (${period}):\n`;
                    tracks.forEach((track, index) => {
                        replyMessage += `${index + 1}. ${track.artist.name} - ${track.name} (${track.playcount} plays)\n`;
                    });

                    await message.reply(replyMessage);

                } catch (error) {
                    console.error(error);
                    await message.reply('an error occurred while fetching the data from Last.fm, maybe wrong username?');
                }
            }
        },
        profile: {
            name: 'fmprofile',
            aliases: ['fmp'],
            description: 'shows detailed last.fm user profile information',
            async run(message, args) {
                const username = args;
                if (!validateUsername(message, username)) return;

                try {
                    const [userInfoRes, recentTracksRes] = await Promise.all([
                        lastfmAPI.getUserInfo(username),
                        lastfmAPI.getRecentTracks(username)
                    ]);

                    const user = userInfoRes.data.user;
                    const recentTrack = recentTracksRes.data.recenttracks.track[0];

                    const registeredDate = new Date(user.registered.unixtime * 1000);
                    const now = new Date();
                    const accountAgeYears = ((now - registeredDate) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
                    const daysActive = Math.floor((now - registeredDate) / (1000 * 60 * 60 * 24));
                    const avgDailyScrobbles = (Number(user.playcount) / daysActive).toFixed(1);

                    let replyMessage = `👤 **Last.fm Profile: ${user.name}**\n\n`;
                    
                    replyMessage += `📊 **Statistics:**\n`;
                    replyMessage += `• Total Scrobbles: ${Number(user.playcount).toLocaleString()}\n`;
                    replyMessage += `• Average Daily Scrobbles: ${avgDailyScrobbles}\n`;
                    replyMessage += `• Account Age: ${accountAgeYears} years\n`;
                    
                    if (recentTrack) {
                        const isNowPlaying = recentTrack['@attr']?.nowplaying;
                        replyMessage += `\n🎵 **${isNowPlaying ? 'Now Playing' : 'Last Played'}:**\n`;
                        replyMessage += `• ${recentTrack.artist['#text']} - ${recentTrack.name}\n`;
                    }

                    replyMessage += `\n🌐 **Profile:**\n`;
                    replyMessage += `• Country: ${user.country || 'not specified'}\n`;
                    replyMessage += `• Profile URL: ${user.url}\n`;
                    replyMessage += `• Registered: ${registeredDate.toLocaleDateString()}\n`;

                    await message.reply(replyMessage);

                } catch (error) {
                    console.error(error);
                    await message.reply('an error occurred while fetching the data from Last.fm, maybe wrong username?');
                }
            }
        }
    }
};