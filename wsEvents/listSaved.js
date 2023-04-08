const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "listSaved",
    path: "/music",
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
            ws.send(JSON.stringify({
                event: 'volume',
                volume: Global.Volume
            }));
            const folder = data.folder || "";
            let parent = "";
            if(folder != ""){
                const [current] = await db.execute("SELECT * FROM `music_files` WHERE `id`=?",[folder]);
                if(current.length == 1){
                    parent = current[0]['info']['parent'];
                }
            }
            const [info] = await db.execute("SELECT `id`,`name` FROM `music_files` WHERE `id`=? OR `id`=?",[folder,parent]);
            const parentData = info.length > 1 ? info.filter(e=>e.id==parent) : [];
            let parentName = "";
            if(parentData.length == 1){
                parentName = parentData[0]['name'];
            }
            const folderData = info.length > 0 ? info.filter(e=>e.id==folder) : [];
            let folderName = "Home";
            if(folderData.length == 1){
                folderName = folderData[0]['name'];
                if(parentData.length == 0)
                    parentName = "Home";
            }
            const [list] = await db.execute("SELECT * FROM `music_files` WHERE `info`->'$.parent'=? ORDER BY `name` ASC",[folder]);
            ws.send(JSON.stringify({
                event: 'listSaved',
                saved: list,
                parent: parent,
                folderName: folderName,
                parentName: parentName
            }));
        } catch(err){
            ws.send(JSON.stringify({"error":"Invalid authentication"}));
        }
        return true;
	},
};