const fs = require('node:fs');
const { Events } = require('discord.js');
const { version, displayName } = require('../package.json');
const { CurrentDate } = require('../util.js');
const { Global } = require("../global.js");

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
        if(fs.existsSync("./settings.json")){
            const data = fs.readFileSync("./settings.json");
            Global.Settings = JSON.parse(data);
			if(Global.Settings.DefaultChannel != null){
				let channel = await client.channels.fetch(Global.Settings.DefaultChannel);
				if(!channel){
					console.error(CurrentDate()+`Invalid default channel:`, Global.Settings.DefaultChannel);
					Global.Settings.DefaultChannel = null;
				}
				Global.Settings.DefaultChannel = channel.id;
			}
        }
		console.log(CurrentDate()+`${displayName} v${version} is ready! Logged in as ${client.user.tag}`);
	},
};