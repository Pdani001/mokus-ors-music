const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { useMasterPlayer } = require("discord-player");
const WSPermissions = require('../perms.js');
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "sortQueue",
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
            if(WSPermissions.hasPermission(User.Permissions,WSPermissions.Play)){
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