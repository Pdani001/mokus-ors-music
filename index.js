const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const CommandDeploy = require('./CommandDeploy.js');
const { CurrentDate }  = require("./util.js");
const db = require("./connection.js");
const client = new Client({ intents: [GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.Guilds] });
const deployer = new CommandDeploy();
const perms = require('./perms.js');
const { Player } = require('discord-player');
const player = Player.singleton(client, {
  autoRegisterExtractor: false // This is to prevent the Deprecation Warning
});
(async() => {
  await player.extractors.loadDefault(); // This is to load the default extractors from the @discord-player/extractor package
})();
const { WebSocketServer } = require("ws");
const { Global } = require("./global.js");
const { parse } = require("url");

const express = require("express");
const web = express();
web.use(express.static(path.join(__dirname, 'public_html')));
const server = web.listen(process.env.PORT);
if(server.listening){
  console.log(CurrentDate()+"HTTP/WebSocket server is listening on port "+server.address().port);
}
let wss = new WebSocketServer({ noServer: true });

const wsEventsPath = path.join(__dirname, 'wsEvents');
const wsEventFiles = fs.readdirSync(wsEventsPath).filter(file => file.endsWith('.js'));

const wsEvents = new Collection();
for (const file of wsEventFiles) {
  const filePath = path.join(wsEventsPath, file);
  const event = require(filePath);
  if ('name' in event && 'execute' in event && 'path' in event){
    wsEvents.set(event.name, event);
  } else {
    console.log(`[WARNING] The WSEvent at ${filePath} is missing a required "name", "path" or "execute" property.`);
  }
}

player.events.on('error', (queue, error) => {
  // Emitted when the player queue encounters error
  console.log(`General player error event: ${error.message}`);
  console.log(error);
  playerLoadQueue(queue);
});
player.events.on('playerError', (queue, error) => {
  // Emitted when the audio player errors while streaming audio track
  console.log(`Player error event: ${error.message}`);
  console.error(error);
  playerLoadQueue(queue);
});
player.events.on('playerStart', playerLoadQueue);
player.events.on('audioTrackAdd', playerLoadQueue);
player.events.on('audioTracksAdd', playerLoadQueue);
player.events.on('playerSkip', playerLoadQueue);
function playerLoadQueue(queue, track){
  Global.Queue = queue;
  wss.broadcast({
    event: 'listQueue',
    queue: queue.tracks.toArray()
  },"/music");
}
player.events.on('disconnect', playerLeaveEvent);
player.events.on('emptyQueue', playerLeaveEvent);
function playerLeaveEvent(queue){
  Global.Queue = null;
  let refresh = Global.LastRefresh;
  refresh.music.paused = true;
  refresh.music.stopped = true;
  wss.broadcast(refresh,"/music");
  wss.broadcast({
    event: 'listQueue',
    queue: []
  },"/music");
}

const interval = setInterval(function ping() {
  const queue = Global.Queue;
  if(queue != null && queue.currentTrack != null){
    const duration = queue.node.estimatedDuration;
    const playback = queue.node.estimatedPlaybackTime;
    const title = queue.currentTrack.title;
    const thumbnail = queue.currentTrack.thumbnail;
    const url = queue.currentTrack.url;
    const paused = queue.node.isPaused();
    const refresh = {
      music: {
        duration: duration,
        playback: playback,
        title: title,
        thumbnail: thumbnail,
        url: url,
        paused: paused,
        stopped: false
      },
      event: 'refresh'
    };
    wss.broadcast(refresh,"/music");
    Global.LastRefresh = refresh;
  }
}, 500);
wss.on('close', function close() {
  clearInterval(interval);
});

client.broadcastWS = (data)=>{
  wss.broadcast(data,"/music");
}
wss.broadcast = (data,path)=>{
  if(path == "*"){
    Global.WSClients.filter((v,k)=>k!="/auth").each(v => {
      v.forEach(function each(ws) {
        ws.send(JSON.stringify(data));
      });
    });
    return;
  }
  Global.WSClients.get(path).forEach(function each(ws) {
    if(ws.auth){
      ws.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', function connection(ws, req) {
  if(ws.auth && Global.LastRefresh != null){
    let refresh = Global.LastRefresh;
    refresh.music.paused = Global.Queue != null ? Global.Queue.node.isPaused() : true;
    refresh.music.stopped = Global.Queue == null;
    ws.send(JSON.stringify(refresh))
  }
  const { pathname } = parse(req.url);
  ws.on('message', function message(data) {
    const obj = JSON.parse(data);
    const eventName = obj.event || "";
    const event = wsEvents.get(eventName);
    if(!event){
      ws.send(JSON.stringify({
        error: `Invalid event '${eventName}'`
      }));
      return;
    }
    if(event.path != pathname && event.path != "*"){
      ws.send(JSON.stringify({
        error: `Invalid path '${pathname}' for event '${eventName}' (Required path: '${event.path}')`
      }));
      return;
    }
    event.execute(wss,ws,req,obj);
  });
  ws.once('close', function close() {
    //console.log(`[${CurrentDate(false)}] [WS] Client disconnected`);
  });
});
server.on('upgrade', function upgrade(request, socket, head) {
  if(request.headers['origin'] == "https://mokus.pghost.org"){
    var cookies = {};
    //Not working any more
    //if(client.upgradeReq.headers.cookie) request.headers.cookie.split(';')...
    //This works
    if(request.headers.cookie) request.headers.cookie.split(';').forEach(function(cookie)
    {
      var parts = cookie.match(/(.*?)=(.*)$/);
      var name = parts[1].trim();
      var value = (parts[2] || '').trim();
      cookies[ name ] = value;
    });
    request.cookies = cookies;
    const { pathname } = parse(request.url);
    if(request.cookies.token == undefined){
      if(pathname != "/auth"){
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
    }
    wss.handleUpgrade(request, socket, head, function done(ws) {
      if(request.cookies.token){
        ws.auth = request.cookies.token;
      }
      if(!Global.WSClients.has(pathname)){
        Global.WSClients.set(pathname, new Set());
      }
      Global.WSClients.get(pathname).add(ws);
      wss.emit('connection', ws, request);
    });
    return;
  }
  socket.destroy();
});

client.commands = new Collection();
const timers = new Collection();
client.createTimer = (channel)=>{
  timers.set(channel.id,setTimeout(()=>{
    const newOwner = channel.members.at(0);
    channel.permissionOverwrites.edit(newOwner.id,perms.allowPerms).catch(console.error);
    db.execute("UPDATE `channels` SET `owner`=? WHERE `channel`=?",[newOwner.id,channel.id]);
    channel.send(`${newOwner.toString()} Mostantól te vagy a szoba tulajdonosa.`);
    timers.delete(channel.id);
    console.log(CurrentDate()+`Owner of ${channel.id} changed to ${newOwner.user.tag}`);
  },300*1000))
}
client.clearTimer = (channelId)=>{
  const timer = timers.get(channelId);
  if(timer == undefined)
      return false;
  clearTimeout(timer);
  timers.delete(channelId);
  return true;
}

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}
console.log(CurrentDate()+`Loaded ${client.commands.size} commands`);

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(process.env.DISCORD_TOKEN);

console.log(process.env.DP_FORCE_YTDL_MOD);

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (text) {
  const full = text.trim();
  const command = full.split(' ')[0].toLowerCase();
  const args = full.split(' ').slice(1);
  switch(command){
    case "quit":
      quit();
      break;
    case "deploy":
      const context = (args.length == 0 ? "server" : args[0]).toLowerCase();
      if(context == "server"){
        deployer.serverDeploy(args.length > 1 && args[1].toLowerCase() == "clear");
      } else {
        deployer.globalDeploy(args.length > 1 && args[1].toLowerCase() == "clear");
      }
      break;
    default:
      console.log(CurrentDate()+"Unknown command: "+command);
      break;
  }
});

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

function exitHandler(options, exitCode) {
  //if (options.cleanup) console.log('clean');
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) quit();
}

async function quit() {
  console.log(CurrentDate()+"Shutting down...");
  const save_setting = "INSERT INTO `music_settings` (`name`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)";
  await db.execute(save_setting, ['volume',Global.Volume]);
  await db.execute(save_setting, ['repeat',Global.RepeatMode]);
  client.destroy();
  db.end();
  process.exit();
}