const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { Global, User } = require("../global.js");
const jwt = require('jsonwebtoken');
const { useMasterPlayer } = require("discord-player");
const { PermissionsBitField } = require("discord.js");
const WSPermissions = require("../perms.js");

module.exports = {
	name: "getSettings",
    path: "/settings",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const key = address + Global.Key;

        let user = null;

        try {
            const payload = jwt.verify(ws.auth,key);
            const UserID = payload.sub;
            const [rows] = await db.execute("SELECT * FROM `music_users` WHERE `id`=?",[UserID || ""]);
            if(rows.length == 0){
                throw new Error("User not found");
            } else {
                if(!Global.Users.has(UserID)){
                    user = new User(rows[0]['id'],rows[0]['name'],rows[0]['user'],BigInt(rows[0]['permission']));
                    Global.Users.set(UserID,user);
                } else {
                    user = Global.Users.get(UserID);
                }
            }
        } catch(err){
            console.error(err);
            ws.send(JSON.stringify({"error":"Invalid authentication"}));
            return false;
        }
        let nameList = [];
        for(let perm in WSPermissions.Bits){
            if(WSPermissions.has(user.Permissions,WSPermissions.Bits[perm],false)){
                nameList.push(perm);
            }
        }
        ws.send(JSON.stringify({
            event: this.name,
            isAdmin: WSPermissions.has(user.Permissions,WSPermissions.Bits.Administrator),
            permissions: nameList
        }));
        return true;
	},
};