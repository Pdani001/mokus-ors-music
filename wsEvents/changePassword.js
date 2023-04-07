const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const { useMasterPlayer } = require("discord-player");
const { PermissionsBitField } = require("discord.js");

module.exports = {
	name: "changePassword",
    path: "/settings",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const key = address + Global.Key;

        if(!data.old || !data.new || !data.newRepeat){
            ws.send(JSON.stringify({"error":"Please fill out all the fields!", event: this.name}));
            return false;
        }

        let UserID = null;
        let User = null;

        try {
            const payload = jwt.verify(ws.auth,key);
            UserID = payload.sub;
            const [rows] = await db.execute("SELECT * FROM `music_users` WHERE `id`=?",[UserID || ""]);
            if(rows.length == 0){
                throw new Error("User not found");
            }
            User = rows[0];
        } catch(err){
            console.error(err);
            ws.send(JSON.stringify({"error":"Invalid authentication"}));
            return false;
        }
        const pw = await bcrypt.compare(data.old,User['password']);
        if(!pw){
            ws.send(JSON.stringify({"error":"Invalid old password", event: this.name}));
            return false;
        }
        if(data.new.length < 8){
            ws.send(JSON.stringify({"error":"The new password must be at least 8 characters long", event: this.name}));
            return false;
        }
        if(data.new == data.old){
            ws.send(JSON.stringify({"error":"The new password can not be the same as the old password", event: this.name}));
            return false;
        }
        if(data.new != data.newRepeat){
            ws.send(JSON.stringify({"error":"The new passwords don't match", event: this.name}));
            return false;
        }
        let newPassword = await bcrypt.hash(data.new,9);
        const [result] = await db.execute("UPDATE `music_users` SET `password`=? WHERE `id`=?",[newPassword, User['id']]);
        ws.send(JSON.stringify({"success":(result.changedRows > 0), event: this.name}));
        return true;
	},
};