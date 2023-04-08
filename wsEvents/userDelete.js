const db = require("../connection.js");
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');
const WSPermissions = require("../perms.js");

module.exports = {
	name: "userDelete",
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
        if(data.user == User.Id){
            ws.send(JSON.stringify({event: this.name, error:"You can't delete your own account"}));
            return false;
        }
        const [result] = await db.execute("DELETE FROM `music_users` WHERE `id`=?",[data.user]);
        if(result.affectedRows > 0)
            Global.Users.delete(data.user);
        ws.send(JSON.stringify({
            deleted: result.affectedRows > 0,
            event: this.name
        }));
        return true;
	},
};