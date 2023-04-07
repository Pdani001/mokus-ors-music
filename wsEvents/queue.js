const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { useMasterPlayer } = require("discord-player");
const WSPermissions = require('../perms.js');
const Global = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "queue",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const key = address + Global.Key;

        try {
            const payload = jwt.verify(ws.auth,key);
            const user = payload.sub;
            const [rows] = await db.execute("SELECT * FROM `music_users` WHERE `id`=?",[user || ""]);
            if(rows.length == 0){
                ws.send(JSON.stringify({"error":"Invalid authentication."}));
                return false;
            }
            const permissions = BigInt(rows[0]['permission']);
            if(WSPermissions.hasPermission(permissions,WSPermissions.Play)){
                if(Global.Queue != null){
                    if(data.remove != undefined){
                        if(data.remove == "all"){
                            Global.Queue.tracks.clear();
                        } else {
                            const track = Global.Queue.tracks.at(data.remove);
                            if(track != undefined){
                                Global.Queue.removeTrack(track);
                            }
                        }
                        wss.broadcast({
                            event: 'listQueue',
                            queue: Global.Queue.tracks.toArray()
                        });
                    }
                }
                if(data.add != undefined){
                    const results = await useMasterPlayer().search(data.add);
                    const channel = Global.Queue != null ? Global.Queue.channel : data.channel || null;
                    if(channel == null){
                        ws.send(JSON.stringify({"event": "listChannels"}));
                        return false;
                    }
                    await useMasterPlayer().play(channel, results, {
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