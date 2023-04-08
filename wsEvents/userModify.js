const db = require("../connection.js");
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');
const WSPermissions = require("../perms.js");

module.exports = {
	name: "userModify",
    path: "/settings",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const key = address + Global.Key;

        let User = null;

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
        if(!data.user){
            ws.send(JSON.stringify({event: this.name, error:"You didn't provide the target user"}));
            return false;
        }
        if(!data.perms){
            ws.send(JSON.stringify({event: this.name, error:"You didn't provide a permission list"}));
            return false;
        }
        let perms = 0n;
        for(let perm in WSPermissions.Bits){
            if(data.perms.indexOf(perm) > -1){
                perms = perms | WSPermissions.Bits[perm];
            }
        }
        if(data.user == User.Id && !WSPermissions.has(perms,WSPermissions.Bits.Administrator,false)){
            ws.send(JSON.stringify({event: this.name, error:"You can't take the Administrator permission from yourself"}));
            return false;
        }
        const [result] = await db.execute("UPDATE `music_users` SET `permission`=? WHERE `id`=?",[perms, data.user]);
        ws.send(JSON.stringify({
            perms: perms.toString(),
            changed:(result.changedRows > 0),
            event: this.name
        }));
        return true;
	},
};