import { GuildQueue, QueueRepeatMode } from "discord-player";
import { Collection, GuildVoiceChannelResolvable } from 'discord.js';

export class Global {
    static Volume: Number = 10;
    static Queue: GuildQueue<unknown> = null;
    static RepeatMode: QueueRepeatMode = QueueRepeatMode.OFF;
    static Default = {
        Channel: <GuildVoiceChannelResolvable> null
    };
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
    static LastChannel: GuildVoiceChannelResolvable = null;
    static readonly Users: Collection<String, User> = new Collection();
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