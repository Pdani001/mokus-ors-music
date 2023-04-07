const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { Global, User } = require("../global.js");
const jwt = require('jsonwebtoken');
const { useMasterPlayer } = require("discord-player");
const { PermissionsBitField } = require("discord.js");

module.exports = {
	name: "getGlobal",
    path: "/music",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const key = address + Global.Key;

        try {
            const payload = jwt.verify(ws.auth,key);
            const user = payload.sub;
            const [rows] = await db.execute("SELECT * FROM `music_users` WHERE `id`=?",[user || ""]);
            if(rows.length == 0){
                ws.send(JSON.stringify({"error":"Invalid authentication"}));
                return false;
            } else {
                if(!Global.Users.has(user)){
                    Global.Users.set(user,new User(rows[0]['id'],rows[0]['name'],rows[0]['user'],BigInt(rows[0]['permission'])));
                }
            }
            let Channels = [];
            await useMasterPlayer().client.guilds.fetch();
            const Guilds = useMasterPlayer().client.guilds.cache.map(guild => guild);
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
                event: 'getGlobal',
                volume: Global.Volume,
                repeat: Global.RepeatMode,
                channels: Channels
            }));
        } catch(err){
            console.error(err);
            ws.send(JSON.stringify({"error":"Invalid authentication"}));
        }
        return true;
	},
};