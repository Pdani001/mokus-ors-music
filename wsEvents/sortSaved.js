const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { useMasterPlayer } = require("discord-player");
const WSPermissions = require('../perms.js');
const Global = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "sortSaved",
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
                if(data.file == undefined || data.newParent == undefined){
                    ws.send(JSON.stringify({"error":"oldIndex and newIndex must be set!"}));
                    return false;
                }
                if(Array.isArray(data.file)){
                    for(const f of data.file){
                        await db.execute("UPDATE `music_files` SET `info`=JSON_SET(`info`,'$.parent',?) WHERE `id`=?",[data.newParent,f]);
                    }
                } else {
                    await db.execute("UPDATE `music_files` SET `info`=JSON_SET(`info`,'$.parent',?) WHERE `id`=?",[data.newParent,data.file]);
                }
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