const axios = require('axios');
const config = require('../config');

module.exports = {
    name: 'ai',
    description: 'AI stuffs (only works in allowed groups)',
    commands: {
        ai: {
            name: 'ai',
            description: 'kinda autistic',
            async run(message, args) {
                try {
                    const chat = await message.getChat();
                    const isGroup = chat.id._serialized.includes('@g.us');

                    if (isGroup) {
                        if (!config.devGroup.includes(chat.id._serialized)) {
                            await message.reply('command is disabled on this group');
                            return;
                        }
                    }

                    if (!args) {
                        await message.reply('please provide a prompt for the AI. Usage: !ai [your question]');
                        return;
                    }

                    // XXX: uses huggingface only for funnies rofl
                    // maybe i could improve this but im EEEEPY
                    const response = await axios.post('https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct', {
                        inputs: `${args}\nAssistant:`,
                        parameters: {
                            max_new_tokens: 512,
                            temperature: 0.8,
                            top_p: 0.9
                        }
                    }, {
                        headers: {
                            'Authorization': `Bearer ${config.huggingFaceKey}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    const aiRsp = response.data[0].generated_text
                        .split('Assistant:')[1]
                        .trim()
                        .replace(/^.*?User/, '')
                        .replace(/\n.*/, '')
                        .trim();

                    const res = aiRsp.length > 1000 
                        ? aiRsp.substring(0, 1000) + '...' 
                        : aiRsp;

                    await message.reply(res);

                } catch (error) {
                    console.error(error);

                    if (error.response) {
                        if (error.response.status === 429) {
                            await message.reply('rate limited. please try again later.');
                        } else {
                            await message.reply('there was an error processing your request.');
                        }
                    } else {
                        await message.reply('an unexpected error occurred.');
                    }
                }
            }
        }
    }
};