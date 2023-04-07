const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { useMasterPlayer, QueryType } = require("discord-player");
const WSPermissions = require('../perms.js');
const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const Global = require("../global.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Zene várólistához adása')
        .addStringOption(option=>option.setName("query").setDescription("Link").setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),
	async execute(interaction) {
        // let's defer the interaction as things can take time to process
        await interaction.deferReply({ephemeral: true});

        const userID = interaction.member.id;
        const [rows] = await db.execute("SELECT * FROM `music_users` WHERE `user`=?",[userID]);
        if(rows.length == 0 || !WSPermissions.hasPermission(BigInt(rows[0]['permission']), WSPermissions.Play)){
            return interaction.followUp({content:`You do not have permission to use this command!`, ephemeral: true});
        }
        
		const channel = interaction.member.voice.channel;
        if (!channel) return interaction.followUp('You are not connected to a voice channel!'); // make sure we have a voice channel
        const query = interaction.options.getString('query', true); // we need input/query to play

        try {
            const results = await useMasterPlayer().search(query, { requestedBy: interaction.user });
            const { track, queue } = await useMasterPlayer().play(channel, results, {
                nodeOptions: {
                    volume: Global.Volume,
                    repeatMode: Global.RepeatMode
                },
                //searchEngine: QueryType.FILE  //TODO: this.
            });

            if(results.tracks.length == 1)
                return interaction.followUp({content:`**${track.title}** is now enqueued`, ephemeral: true});
            else
                return interaction.followUp({content:`Playlist **${track.playlist.title}** is now enqueued`, ephemeral: true});
        } catch (e) {
            // let's return error if something failed
            return interaction.followUp({content:`Something went wrong: ${e}`, ephemeral: true});
        }
	},
};