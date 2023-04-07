const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "listQueue",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const key = address + Global.Key;

        try {
            const payload = jwt.verify(ws.auth,key);
            const user = payload.sub;
            if(Global.Users.get(user) == undefined){
                ws.send(JSON.stringify({"error":"Invalid authentication"}));
                return false;
            }
            let queue = [];
            if(Global.Queue != null){
                queue = Global.Queue.tracks.toArray();
            }
            ws.send(JSON.stringify({
                event: 'listQueue',
                queue: queue
            }));
        } catch(err){
            ws.send(JSON.stringify({"error":"Invalid authentication"}));
        }
        return true;
	},
};