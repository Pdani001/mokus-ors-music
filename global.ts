import { GuildQueue, QueueRepeatMode } from "discord-player";
import { GuildVoiceChannelResolvable } from 'discord.js';

class Global {
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
}
export = Global;