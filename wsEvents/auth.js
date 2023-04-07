const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Global = require("../global.js");

module.exports = {
	name: "auth",
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
        console.log(`[${CurrentDate(false)}] [WS] ${rows[0]['id']} logged in`);
        const key = address + Global.Key;
        const issued = Math.floor(Date.now() / 1000);
        const token = jwt.sign({
            iat: issued,
            iss: "mokus.pghost.org",
            sub: rows[0]['id']
        }, key);
        ws.send(JSON.stringify({"token":token,"expiresAt":0}));
        return true;
	},
};