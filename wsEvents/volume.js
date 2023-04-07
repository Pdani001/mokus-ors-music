const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { useMasterPlayer } = require("discord-player");
const WSPermissions = require('../perms.js');
const Global = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "volume",
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
                wss.broadcast(data);
                Global.Volume = Number(data.volume);
                if(Global.Volume > 100 && !WSPermissions.hasPermission(permissions,WSPermissions.Administrator))
                    Global.Volume = 100;
                if(Global.Queue != null){
                    Global.Queue.node.setVolume(Global.Volume);
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