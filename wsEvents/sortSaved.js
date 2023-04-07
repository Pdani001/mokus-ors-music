const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { useMasterPlayer } = require("discord-player");
const WSPermissions = require('../perms.js');
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "sortSaved",
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
            if(WSPermissions.hasPermission(User.Permissions,WSPermissions.Edit)){
                if(data.file == undefined || data.newParent == undefined){
                    ws.send(JSON.stringify({"error":"file and newParent must be set!"}));
                    return false;
                }
                if(Array.isArray(data.file)){
                    await db.execute("UPDATE `music_files` SET `info`=JSON_SET(`info`,'$.parent',?) WHERE ("+(new Array(data.file.length).fill("`id`=?").join(" OR "))+") AND `id`!=?",[data.newParent,...data.file,data.newParent]);
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