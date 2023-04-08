const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');
const { useMasterPlayer } = require("discord-player");
const { PermissionsBitField } = require("discord.js");
const WSPermissions = require("../perms.js");

module.exports = {
	name: "listUsers",
    path: "/settings",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const key = address + Global.Key;

        let User;

        try {
            const payload = jwt.verify(ws.auth,key);
            const UserID = payload.sub;
            User = Global.Users.get(UserID);
            if(User == undefined){
                throw new Error("User not found");
            }
        } catch(err){
            console.error(err);
            ws.send(JSON.stringify({"error":"Invalid authentication"}));
            return false;
        }
        if(!WSPermissions.has(User.Permissions, WSPermissions.Bits.Administrator)){
            ws.send(JSON.stringify({event: this.name, error:"You don't have permission to do this"}));
            return false;
        }

        const [rows] = await db.execute("SELECT `id`,`name`,`permission` FROM `music_users`");

        ws.send(JSON.stringify({
            event: this.name,
            list: rows
        }));
        return true;
	},
};