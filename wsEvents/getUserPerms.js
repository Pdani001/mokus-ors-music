const db = require("../connection.js");
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');
const WSPermissions = require("../perms.js");

module.exports = {
	name: "getUserPerms",
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
        if(data.list == undefined){
            ws.send(JSON.stringify({event: this.name, error:"You didn't provide a permission list"}));
            return false;
        }
        let nameList = [];
        for(let perm in WSPermissions.Bits){
            if(WSPermissions.has(BigInt(data.list),WSPermissions.Bits[perm],false)){
                nameList.push(perm);
            }
        }
        ws.send(JSON.stringify({
            event: this.name,
            list: nameList
        }));
        return true;
	},
};