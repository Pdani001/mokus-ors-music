const { Events } = require('discord.js');
const db = require("../connection.js");
const { version, displayName } = require('../package.json');
const { CurrentDate } = require('../util.js');
const perms = require('../perms.js');
const Global = require('../global.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(CurrentDate()+`${displayName} v${version} is ready! Logged in as ${client.user.tag}`);
        const [settings] = await db.execute("SELECT * FROM `music_settings`");
        settings.forEach(async row => {
            const key = row['name'];
            const value = row['value'];
            switch(key){
                case "default.channel":
                    try {
                        const channel = await client.channels.fetch(value);
                        Global.Default.Channel = channel;
                    } catch(e){
                        console.log(CurrentDate()+`Value '${value}' is invalid for key '${key}'`);
                    }
                    break;
                case "volume":
                    Global.Volume = Number(value);
                    break;
                case "repeat":
                    Global.RepeatMode = Number(value);
                    break;
                default:
                    console.log(CurrentDate()+`Music settings key '${key}' is invalid`);
                    break;
            }
        });
	},
};