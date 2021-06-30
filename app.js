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
    client.user.setActivity('🤔 au!help', { type: 'LISTENING' });
});

client.on('raw', data => {
    let eventType = data['t'];

    if (eventType == 'MESSAGE_REACTION_ADD' || eventType == 'MESSAGE_REACTION_REMOVE') {
        if (data['d']['guild_id'] == undefined) return;

        let guildID = data['d']['guild_id'];
        if (!guildID in emojisConfigs) return;

        let guild = client.guilds.cache.get(guildID);
        let guildData = emojisConfigs[guildID];

        let messageID = data['d']['message_id'];
        if (messageID != guildData['message_id']) return;

        if (!data['d']['emoji']['name'] in guildData['emojis']) return;
        let roleID = guildData['emojis'][data['d']['emoji']['name']];

        let role = guild.roles.cache.get(roleID);
        if (role == undefined) return;

        let member = guild.members.cache.get(data['d']['user_id']);
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

client.login(process.env.BOT_TOKEN);