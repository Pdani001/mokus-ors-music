const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const WSPermissions = require('../perms.js');
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "pause",
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
                if(Global.Queue != null){
                    Global.Queue.node.setPaused(data.toggle);
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