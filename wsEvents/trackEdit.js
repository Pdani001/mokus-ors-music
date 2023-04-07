const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { useMasterPlayer } = require("discord-player");
const WSPermissions = require('../perms.js');
const Global = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "trackEdit",
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
            if(WSPermissions.hasPermission(permissions,WSPermissions.Edit)){
                if(data.id == undefined || data.name == undefined){
                    ws.send(JSON.stringify({"error":"id and name must be set"}));
                    return false;
                }
                await db.execute("UPDATE `music_files` SET `name`=? WHERE `id`=?",[data.name,data.id]);
                wss.broadcast(data);
            } else {
                ws.send(JSON.stringify({"error":"You do not have permission to do this"}));
            }
        } catch(err){
            ws.send(JSON.stringify({"error":"Invalid authentication"}));
        }
        return true;
	},
};