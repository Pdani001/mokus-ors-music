"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Global = void 0;
const discord_player_1 = require("discord-player");
const discord_js_1 = require("discord.js");
class Global {
    /**
     * @since 0.6.0
     */
    static Settings = {
        Volume: 10,
        RepeatMode: discord_player_1.QueueRepeatMode.OFF,
        DefaultChannel: null
    };
    /**
     * @deprecated will be removed in *0.7.0*
     * @deprecated use {@link Global.Settings.Volume} instead
     */
    static get Volume() {
        return this.Settings.Volume;
    }
    /**
     * @deprecated will be removed in *0.7.0*
     * @deprecated use {@link Global.Settings.Volume} instead
     */
    static set Volume(value) {
        this.Settings.Volume = value;
    }
    /**
     * @deprecated will be removed in *0.7.0*
     * @deprecated use {@link Global.Settings.RepeatMode} instead
     */
    static get RepeatMode() {
        return this.Settings.RepeatMode;
    }
    /**
     * @deprecated will be removed in *0.7.0*
     * @deprecated use {@link Global.Settings.RepeatMode} instead
     */
    static set RepeatMode(value) {
        this.Settings.RepeatMode = value;
    }
    static Queue = null;
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