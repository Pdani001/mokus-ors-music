const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { useMasterPlayer } = require("discord-player");
const WSPermissions = require('../perms.js');
const { Global } = require("../global.js");
const jwt = require('jsonwebtoken');
const uuid = require("uuid").v4;

module.exports = {
	name: "save",
    path: "/music",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const key = address + Global.Key;

        try {
            const payload = jwt.verify(ws.auth,key);
            const UserID = payload.sub;
            const User = Global.Users.get(UserID);
            if(User == undefined){
                ws.send(JSON.stringify({"error":"Invalid authentication"}));
                return false;
            }
            const required = data.remove == undefined ? WSPermissions.Bits.Create : WSPermissions.Bits.Delete;
            if(WSPermissions.has(User.Permissions,required)){
                const now = Math.floor(Date.now() / 1000);
                if(required == WSPermissions.Bits.Delete){
                    if(Array.isArray(data.remove)){
                        const Remove = [];
                        for(const e of data.remove){
                            if(e.type == "folder"){
                                const [list] = await db.execute("SELECT `id` FROM `music_files` WHERE `info`->'$.parent'=?",[e.id]);
                                if(list.length > 0){
                                    continue;
                                }
                            }
                            Remove.push(e.id);
                        }
                        if(Remove.length > 0){
                            await db.execute("DELETE FROM `music_files` WHERE "+(new Array(Remove.length).fill("`id`=?").join(" OR ")),Remove);
                        }
                    } else {
                        if(data.folder){
                            const [list] = await db.execute("SELECT `id` FROM `music_files` WHERE `info`->'$.parent'=?",[data.remove]);
                            if(list.length > 0){
                                ws.send(JSON.stringify({error:"Folder is not empty!", event:'save'}));
                                return false;
                            }
                        }
                        await db.execute("DELETE FROM `music_files` WHERE `id`=?",[data.remove]);
                    }
                } else {
                    const parent = data.parent || "";
                    const type = data.folder ? "folder" : "url";
                    if(data.folder){
                        const info = JSON.stringify({
                            parent: parent
                        });
                        await db.execute("INSERT INTO `music_files` (`id`,`name`,`info`,`type`,`created`,`creator`) VALUES (?,?,?,?,?,?)",[uuid(),data.add,info,type,now,UserID]);
                    } else {
                        data.saved = 0;
                        const add = [...data.add];
                        const insert = await Promise.all(add.map(async url=>{
                            try {
                                new URL(url);
                            } catch(err){
                                return null;
                            }
                            const results = await useMasterPlayer().search(url);
                            if(results.tracks.length == 0){
                                return null;
                            }
                            if(!results.hasPlaylist()){
                                data.saved += results.tracks.length;
                                return results.tracks.map(track => {
                                    const info = JSON.stringify({
                                        parent: parent,
                                        thumbnail: track.thumbnail,
                                        url: track.url,
                                        duration: track.duration
                                    });
                                    return [uuid(),track.title,info,type,now,UserID];
                                });
                            } else {
                                data.saved += 1;
                                const info = JSON.stringify({
                                    parent: parent,
                                    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Music_playlist_-_The_Noun_Project.svg",
                                    url: results.playlist.url,
                                    duration: results.playlist.durationFormatted
                                });
                                return [[uuid(),results.playlist.title,info,type,now,UserID]];
                            }
                        }));
                        const final = [];
                        insert.filter(e=>e != null).forEach(e=>{
                            e.forEach(t=>final.push(t));
                        });
                        if(final.length > 0)
                            await db.query("INSERT INTO `music_files` (`id`,`name`,`info`,`type`,`created`,`creator`) VALUES ?",[final]);
                    }
                }
                wss.broadcast(data,"/music");
            } else {
                ws.send(JSON.stringify({"error":"You do not have permission to do this", "event": "save"}));
            }
        } catch(err){
            ws.send(JSON.stringify({"error":err, "event": "save"}));
        }
        return true;
	},
};