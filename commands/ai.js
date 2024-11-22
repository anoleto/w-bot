const axios = require('axios');
const config = require('../config');

const chatHistory = new Map();

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

                    const query = Array.isArray(args) ? args.join(' ') : args.toString();

                    if (!chatHistory.has(chat.id._serialized)) {
                        chatHistory.set(chat.id._serialized, []);
                    }

                    const history = chatHistory.get(chat.id._serialized);
                    
                    const prompt = history.slice(-10)
                        .concat(`User: ${query}`, 'Assistant:')
                        .join('\n');

                    // XXX: uses huggingface only for funnies rofl
                    // maybe i could improve this but im EEEEPY
                    const response = await axios.post('https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct', {
                        inputs: prompt,
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
                        .split('Assistant:')
                        .pop()
                        .split('User:')[0]
                        .replace(/\bUser\b/g, '')
                        .trim();

                    const res = aiRsp.length > 1000 
                        ? aiRsp.substring(0, 1000) + '...' 
                        : aiRsp;

                    history.push(`User: ${query}`);
                    history.push(`Assistant: ${aiRsp}`);

                    if (history.length > 20) {
                        history.splice(0, history.length - 20);
                    }

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
        },
        resetai: {
            name: 'resetai',
            aliases: ['rst', 'reset'],
            description: 'restart ai chat history',
            async run(message) {
                const chat = await message.getChat();
                chatHistory.delete(chat.id._serialized);

                await message.reply('ai chat history has been resetted.')
            }
        }
    }
};