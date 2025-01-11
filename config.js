require('dotenv').config();

module.exports = {
    prefix: 'k!',
    ownerId: process.env.OWNER_IDS.split(','),
    devGroup: process.env.DEV_GROUPS.split(','),
    debug: process.env.DEBUG === 'true',

    lastfmApiKey: process.env.LASTFM_API_KEY,
    huggingFaceKey: process.env.HUGGINGFACE_KEY,
    spotify: {
        clientid: process.env.SPOTIFY_CLIENT_ID,
        clientsecret: process.env.SPOTIFY_CLIENT_SECRET,
    },
};