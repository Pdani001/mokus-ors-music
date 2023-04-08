const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { Global, User } = require("../global.js");
const WSPermissions = require("../perms.js");

module.exports = {
	name: "auth",
    path: "/auth",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const [rows] = await db.execute("SELECT * FROM `music_users` WHERE `name`=?",[data.name || ""]);
        if(rows.length == 0){
            ws.send(JSON.stringify({"error":"Invalid username or password"}));
            return false;
        }
        const pw = await bcrypt.compare(data.password,rows[0]['password']);
        if(!pw){
            ws.send(JSON.stringify({"error":"Invalid username or password"}));
            return false;
        }
        const perms = BigInt(rows[0]['permission']);
        if(!WSPermissions.has(perms,WSPermissions.Bits.Login)){
            ws.send(JSON.stringify({"error":"You don't have permission to login to the web panel"}));
            return false;
        }
        console.log(`[${CurrentDate(false)}] [WS] ${rows[0]['id']} logged in`);
        const key = address + Global.Key;
        const issued = Math.floor(Date.now() / 1000);
        const token = jwt.sign({
            iat: issued,
            iss: "mokus.pghost.org",
            sub: rows[0]['id']
        }, key);
        const user = Global.Users.get(rows[0]['id']) || new User(rows[0]['id'],rows[0]['name'],rows[0]['user'],BigInt(rows[0]['permission']));
        user.Permissions = perms;
        Global.Users.set(rows[0]['id'],user);
        ws.send(JSON.stringify({"token":token,"expiresAt":0}));
        return true;
	},
};