const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { Global } = require('../global.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playing')
		.setDescription('Jelenlegi szám nevének lekérése')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),
	async execute(interaction) {
        if(Global.Queue == null){
			return interaction.reply({content:`I'm currently not playing anything`, ephemeral: true});
		}
		return interaction.reply({content:`Currently playing: **${Global.Queue.currentTrack.title}**`, ephemeral: true});
	},
};