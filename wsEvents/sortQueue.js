const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { useMasterPlayer } = require("discord-player");
const WSPermissions = require('../perms.js');
const Global = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "sortQueue",
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
            }
            const permissions = BigInt(rows[0]['permission']);
            if(WSPermissions.hasPermission(permissions,WSPermissions.Play)){
                if(data.oldIndex == undefined || data.newIndex == undefined){
                    ws.send(JSON.stringify({"error":"oldIndex and newIndex must be set!"}));
                    return false;
                }
                if(Global.Queue != null){
                    const track = Global.Queue.tracks.at(data.oldIndex);
                    if(track == undefined)
                        return false;
                    Global.Queue.node.move(track,data.newIndex);
                    wss.broadcast({
                        event: 'listQueue',
                        queue: Global.Queue.tracks.toArray()
                    });
                }
            } else {
                ws.send(JSON.stringify({"error":"You do not have permission to do this"}));
            }
        } catch(err){
            ws.send(JSON.stringify({"error":"Invalid authentication"}));
        }
        return true;
	},
};