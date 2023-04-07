const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { Global } = require("../global.js");
const WSPermissions = require('../perms.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('volume')
		.setDescription('Zene hangerő módosítása')
        .addIntegerOption(option=>option.setName("number").setDescription("Új hangerő").setMinValue(0).setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),
	async execute(interaction) {
        // let's defer the interaction as things can take time to process
        await interaction.deferReply({ephemeral: true});
        const UserID = interaction.member.id;
        const [rows] = await db.execute("SELECT * FROM `music_users` WHERE `user`=?",[UserID]);
        if(rows.length == 0 || !WSPermissions.hasPermission(BigInt(rows[0]['permission']), WSPermissions.Play)){
            return interaction.followUp({content:`You do not have permission to use this command!`, ephemeral: true});
        }
        
        Global.Volume = interaction.options.getInteger('number', true);
        if(Global.Volume > 100 && !WSPermissions.hasPermission(BigInt(rows[0]['permission']),WSPermissions.Administrator))
            Global.Volume = 100;

        try {
            if(Global.Queue != null){
                Global.Queue.node.setVolume(Global.Volume);
            }
            interaction.client.broadcastWS({
                event: 'volume',
                volume: Global.Volume
            })

            return interaction.followUp({content:`Volume set to **${volume}%**`, ephemeral: true});
        } catch (e) {
            // let's return error if something failed
            return interaction.followUp({content:`Something went wrong: ${e}`, ephemeral: true});
        }
	},
};