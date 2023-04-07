const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { useMasterPlayer } = require("discord-player");
const WSPermissions = require('../perms.js');
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "trackEdit",
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
                if(data.id == undefined || data.name == undefined){
                    ws.send(JSON.stringify({"error":"id and name must be set"}));
                    return false;
                }
                await db.execute("UPDATE `music_files` SET `name`=? WHERE `id`=?",[data.name,data.id]);
                console.log(`[${CurrentDate(false)}] [WS] Track ${data.id} renamed by ${UserID}`);
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