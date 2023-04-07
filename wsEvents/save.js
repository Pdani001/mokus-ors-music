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
            const required = data.remove == undefined ? WSPermissions.Create : WSPermissions.Delete;
            if(WSPermissions.hasPermission(User.Permissions,required)){
                const now = Math.floor(Date.now() / 1000);
                if(required == WSPermissions.Delete){
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
                        await Promise.all(data.add.map(async url=>{
                            const results = await useMasterPlayer().search(url);
                            if(!results.hasPlaylist()){
                                const insert = [];
                                for(let i = 0; i < results.tracks.length; i++){
                                    const track = results.tracks[i];
                                    const info = JSON.stringify({
                                        parent: parent,
                                        thumbnail: track.thumbnail,
                                        url: track.url,
                                        duration: track.duration
                                    });
                                    insert.push([uuid(),track.title,info,type,now,UserID]);
                                }
                                await db.execute("INSERT INTO `music_files` (`id`,`name`,`info`,`type`,`created`,`creator`) VALUES ?",[insert]);
                            } else {
                                const info = JSON.stringify({
                                    parent: parent,
                                    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Music_playlist_-_The_Noun_Project.svg",
                                    url: results.playlist.url,
                                    duration: results.playlist.durationFormatted
                                });
                                await db.execute("INSERT INTO `music_files` (`id`,`name`,`info`,`type`,`created`,`creator`) VALUES (?,?,?,?,?,?)",[uuid(),results.playlist.title,info,type,now,UserID]);
                            }
                        }));
                    }
                }
                wss.broadcast(data,"/music");
            } else {
                ws.send(JSON.stringify({"error":"You do not have permission to do this"}));
            }
        } catch(err){
            ws.send(JSON.stringify({"error":err}));
        }
        return true;
	},
};