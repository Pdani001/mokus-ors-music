const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { useMasterPlayer } = require("discord-player");
const WSPermissions = require('../perms.js');
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "volume",
    path: "/music",
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
            if(WSPermissions.has(User.Permissions,WSPermissions.Bits.Play)){
                wss.broadcast(data,"/music");
                Global.Settings.Volume = Number(data.volume);
                if(Global.Settings.Volume > 100 && !WSPermissions.has(permissions,WSPermissions.Bits.Administrator))
                    Global.Settings.Volume = 100;
                if(Global.Queue != null){
                    Global.Queue.node.setVolume(Global.Settings.Volume);
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