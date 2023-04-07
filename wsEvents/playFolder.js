const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { useMasterPlayer } = require("discord-player");
const WSPermissions = require('../perms.js');
const Global = require("../global.js");
const jwt = require('jsonwebtoken');

module.exports = {
	name: "playFolder",
	async execute(wss, ws, req, data) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        const key = address + Global.Key;

        try {
            const payload = jwt.verify(ws.auth,key);
            const user = payload.sub;
            const [rows] = await db.execute("SELECT * FROM `music_users` WHERE `id`=?",[user || ""]);
            if(rows.length == 0){
                ws.send(JSON.stringify({"error":"Invalid authentication."}));
                return false;
            }
            const permissions = BigInt(rows[0]['permission']);
            if(WSPermissions.hasPermission(permissions,WSPermissions.Play)){
                if(data.folder == undefined)
                    return false;
                const [list] = await db.execute("SELECT `info`->'$.url' AS `url` FROM `music_files` WHERE `info`->'$.parent'=? AND `type`='url'",[data.folder]);
                if(list.length == 0)
                    return false;
                let channel = Global.Queue != null ? Global.Queue.channel : data.channel || null;
                if(channel == null){
                    ws.send(JSON.stringify({"event": "listChannels"}));
                    return false;
                }
                console.log(`[${CurrentDate(false)}] [WS] Folder playback start from ${user}`);
                let tracks = [];
                await Promise.all(list.map(async val=>{
                    const results = await useMasterPlayer().search(val.url);
                    tracks = tracks.concat(results.tracks);
                }));
                const array_chunks = (array, chunk_size) => Array(Math.ceil(array.length / chunk_size)).fill().map((_, index) => index * chunk_size).map(begin => array.slice(begin, begin + chunk_size));
                const track_chunks = array_chunks(tracks,10);
                let chunk = 0;
                if(Global.Queue == null){
                    const {queue} = await useMasterPlayer().play(channel, track_chunks[chunk++], {
                        nodeOptions: {
                            volume: Global.Volume,
                            repeatMode: Global.RepeatMode
                        }
                    });
                    for(let i = chunk; i < track_chunks.length; i++){
                        queue.tracks.add(track_chunks[i]);
                    }
                } else {
                    for(let i = chunk; i < track_chunks.length; i++){
                        Global.Queue.tracks.add(track_chunks[i]);
                    }
                }
            } else {
                ws.send(JSON.stringify({"error":"You do not have permission to do this"}));
            }
        } catch(err){
            console.error(err);
            ws.send(JSON.stringify({"error":"Invalid authentication"}));
        }
        return true;
	},
};