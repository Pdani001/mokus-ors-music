const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');
const { useMasterPlayer } = require("discord-player");
const { PermissionsBitField } = require("discord.js");

module.exports = {
	name: "listChannels",
    path: "*",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const key = address + Global.Key;

        try {
            const payload = jwt.verify(ws.auth,key);
            const UserID = payload.sub;
            const User = Global.Users.get(UserID);
            if(User == undefined){
                ws.send(JSON.stringify({"error":"Invalid authentication"}));
                return false;
            }
            let Channels = [];
            await useMasterPlayer().client.guilds.fetch();
            const Guilds = useMasterPlayer().client.guilds.cache.map(guild => guild).sort((a,b)=>{
                return Number(BigInt(a.id) - BigInt(b.id));
            });
            await Promise.all(Guilds.map(async guild=>{
                const allChannels = await guild.channels.fetch();
                const voices = allChannels.filter(channel => channel != null && channel.isVoiceBased() && channel.permissionsFor(useMasterPlayer().client.user).has(PermissionsBitField.Flags.Connect)).map(channel => { return {name: channel.name, id: channel.id}; });
                if(voices.length > 0){
                    Channels.push({
                        "name": guild.name,
                        "id": guild.id,
                        "channels": voices
                    });
                }
            }));
            ws.send(JSON.stringify({
                event: 'listChannels',
                channels: Channels,
                show: false
            }));
        } catch(err){
            console.error(err);
            ws.send(JSON.stringify({"error":"Invalid authentication"}));
        }
        return true;
	},
};