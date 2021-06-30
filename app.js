const Discord = require('discord.js');
const client = new Discord.Client();

require('dotenv').config();
var emojisConfigs = {};

client.on('ready', () => {
    let readyAt = client.readyAt.toLocaleString('en-US', {
        timeZone: 'Asia/Bangkok',
        hour12: false,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    });

    let logMessages = `Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds. `;
    logMessages += `Ready at ${readyAt}`;
    console.log(logMessages);

    emojisConfigs = require('./emojis.json');
    console.log('Emojis config loaded!');
    client.user.setActivity('🤔 !setup', { type: 'LISTENING' });
});

client.on('raw', async data => {
    let eventType = data['t'];

    if (eventType == 'MESSAGE_REACTION_ADD' || eventType == 'MESSAGE_REACTION_REMOVE') {
        if (data['d']['guild_id'] == undefined) return;

        let guildID = data['d']['guild_id'];
        if (!guildID in emojisConfigs) return;

        let guild = client.guilds.cache.get(guildID);
        let guildData = emojisConfigs[guildID];

        let messageID = data['d']['message_id'];
        if (!messageID in guildData) return;

        let emoteName = data['d']['emoji']['name'];
        if (!emoteName in guildData[messageID]['emojis']) return;
        let roleID = guildData[messageID]['emojis'][emoteName];

        let role = guild.roles.cache.get(roleID);
        if (role == undefined) return;

        let member = await guild.members.fetch(data['d']['user_id']);
        if (member == undefined) return;

        let addRole = eventType == 'MESSAGE_REACTION_ADD' ? true : false;
        if (addRole == true) {
            member.roles.add(role);
            return;
        }

        member.roles.remove(role);
        return;
    }
});

client.on('message', async message => {
    if (message.author.bot) return;

    const prefix = '!';
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command == 'setup') {
        if (message.member.hasPermission('ADMINISTRATOR') == false) {
            return message.channel.send('You don\'t have `ADMINISTRATOR` permission!');
        }

        let guildID = message.guild.id;
        if (!guildID in emojisConfigs) {
            return message.channel.send('This server isn\'t config!');
        }

        for (let key in emojisConfigs[guildID]) {
            let messageData = emojisConfigs[guildID][key];

            let reactedChannel = message.guild.channels.cache.get(messageData['channel_id']);
            if (reactedChannel == undefined) return message.channel.send(`Invalid channel ID! \`${messageData['channel_id']}\``);

            let reactedMessage = await reactedChannel.messages.fetch(key);
            if (reactedMessage == undefined) return message.channel.send(`Invalid message ID! \`${key}\``);

            for (let emoji in messageData['emojis']) {
                let reactedEmoji = message.guild.emojis.cache.find(e => e.name == emoji);
                if (reactedEmoji == undefined) {
                    reactedEmoji = emoji;
                }

                try {
                    reactedMessage.react(reactedEmoji);
                } catch (error) {
                    console.log(error);
                    message.channel.send(`Failed to react ${reactedEmoji}`);
                }
            }
        }

        return message.channel.send('All channels/messages setup');
    }
});

client.login(process.env.BOT_TOKEN);