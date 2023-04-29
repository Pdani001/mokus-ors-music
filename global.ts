import { GuildQueue, QueueRepeatMode } from "discord-player";
import { Collection, ChannelResolvable } from 'discord.js';
import WebSocket from 'ws';

export class Global {
    /**
     * @since 0.6.0
     */
    static Settings: {
        Volume: Number;
        RepeatMode: QueueRepeatMode;
        DefaultChannel: ChannelResolvable;
    } = {
        Volume: 10,
        RepeatMode: QueueRepeatMode.OFF,
        DefaultChannel: null
    };
    /**
     * @deprecated will be removed in *0.7.0*
     * @deprecated use {@link Global.Settings.Volume} instead
     */
    static get Volume(): Number {
        return this.Settings.Volume;
    }
    /**
     * @deprecated will be removed in *0.7.0*
     * @deprecated use {@link Global.Settings.Volume} instead
     */
    static set Volume(value: Number) {
        this.Settings.Volume = value;
    }
    /**
     * @deprecated will be removed in *0.7.0*
     * @deprecated use {@link Global.Settings.RepeatMode} instead
     */
    static get RepeatMode(): QueueRepeatMode {
        return this.Settings.RepeatMode;
    }
    /**
     * @deprecated will be removed in *0.7.0*
     * @deprecated use {@link Global.Settings.RepeatMode} instead
     */
    static set RepeatMode(value: QueueRepeatMode) {
        this.Settings.RepeatMode = value;
    }
    static Queue: GuildQueue<unknown> = null;
    static readonly Key: string = "$tqYqbKQq8s8uD7zY";
    static LastRefresh: {
        music: {
            duration: number;
            playback: number;
            title: string;
            thumbnail: string;
            url: string;
            paused: boolean;
            stopped: boolean;
        };
        event: string;
    } = null;
    static readonly Users: Collection<String, User> = new Collection();
    static readonly WSClients: Collection<String, Set<WebSocket.WebSocket>> = new Collection();
}

export class User {
    readonly Id: String = null;
    readonly Name: String = null;
    readonly Snowflake: String = null;
    Permissions: BigInt = 0n;

    constructor(Id: String, Name: String, Snowflake: String, Permissions: BigInt){
        this.Id = Id;
        this.Name = Name;
        this.Snowflake = Snowflake;
        this.Permissions = Permissions;
    }
}