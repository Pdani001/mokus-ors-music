"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Global = void 0;
const discord_player_1 = require("discord-player");
const discord_js_1 = require("discord.js");
class Global {
    static Volume = 10;
    static Queue = null;
    static RepeatMode = discord_player_1.QueueRepeatMode.OFF;
    static Key = "$tqYqbKQq8s8uD7zY";
    static LastRefresh = null;
    static Users = new discord_js_1.Collection();
    static WSClients = new discord_js_1.Collection();
}
exports.Global = Global;
class User {
    Id = null;
    Name = null;
    Snowflake = null;
    Permissions = 0n;
    constructor(Id, Name, Snowflake, Permissions) {
        this.Id = Id;
        this.Name = Name;
        this.Snowflake = Snowflake;
        this.Permissions = Permissions;
    }
}
exports.User = User;
//# sourceMappingURL=global.js.map