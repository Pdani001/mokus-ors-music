const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { useMasterPlayer } = require("discord-player");
const WSPermissions = require('../perms.js');
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');
const { PermissionsBitField } = require("discord.js");

module.exports = {
	name: "play",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const key = address + Global.Key;

        try {
            const payload = jwt.verify(ws.auth,key);
            const UserID = payload.sub;
            const User = Global.Users.get(UserID);
            if(User == undefined){
                ws.send(JSON.stringify({"error":"Invalid authentication."}));
                return false;
            }
            if(WSPermissions.hasPermission(User.Permissions,WSPermissions.Play)){
                if(data.at != undefined){
                    if(Global.Queue == null){
                        return false;
                    }
                    const track = Global.Queue.tracks.at(data.at);
                    if(track == undefined){
                        return false;
                    }
                    Global.Queue.node.jump(track);
                    return true;
                }
                if(data.query == undefined)
                    return false;
                const results = await useMasterPlayer().search(data.query);
                if(Global.Queue != null && results.tracks.length == 1){
                    Global.Queue.insertTrack(results.tracks[0], 0);
                    if(Global.Queue.tracks.size > 0){
                        Global.Queue.node.jump(results.tracks[0]);
                    }
                } else {
                    const channel = Global.Queue != null ? Global.Queue.channel : data.channel || null;
                    if(channel == null){
                        ws.send(JSON.stringify({"event": "listChannels"}));
                        return false;
                    }
                    await useMasterPlayer().play(data.channel, results, {
                        nodeOptions: {
                            volume: Global.Volume,
                            repeatMode: Global.RepeatMode
                        }
                    });
                }
            } else {
                ws.send(JSON.stringify({"error":"You do not have permission to do this"}));
            }
        } catch(err){
            console.error(err);
            ws.send(JSON.stringify({"error":"Invalid authentication"}));
        }
        return true;
	},
};