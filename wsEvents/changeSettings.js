const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const { useMasterPlayer } = require("discord-player");
const { PermissionsBitField } = require("discord.js");
const WSPermissions = require("../perms.js");

module.exports = {
	name: "changeSettings",
    path: "/settings",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const key = address + Global.Key;

        let UserID = null;
        let User = null;

        try {
            const payload = jwt.verify(ws.auth,key);
            UserID = payload.sub;
            if(Global.Users.get(UserID) == undefined){
                throw new Error("User not found");
            }
            User = Global.Users.get(UserID);
            if(!WSPermissions.has(User.Permissions,WSPermissions.Bits.Administrator)){
                throw new Error("User not admin");
            }
        } catch(err){
            console.error(err);
            ws.send(JSON.stringify({"error":"Invalid authentication"}));
            return false;
        }
        let channel = data.channel || null;
        if(channel != null){
            channel = await useMasterPlayer().client.channels.fetch(channel);
            if(!channel){
                ws.send(JSON.stringify({"error":"Invalid channel: "+data.channel, event: this.name}));
                return false;
            }
        }
        Global.Settings.DefaultChannel = channel.id;
        ws.send(JSON.stringify({"success":true, event: this.name}));
        return true;
	},
};