const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { useQueue } = require("discord-player");
const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const Global = require("../global.js");
const WSPermissions = require('../perms.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('volume')
		.setDescription('Zene hangerő módosítása')
        .addIntegerOption(option=>option.setName("number").setDescription("Új hangerő").setMinValue(0).setMaxValue(100).setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),
	async execute(interaction) {
        // let's defer the interaction as things can take time to process
        await interaction.deferReply({ephemeral: true});
        const userID = interaction.member.id;
        const [rows] = await db.execute("SELECT * FROM `music_users` WHERE `user`=?",[userID]);
        if(rows.length == 0 || !WSPermissions.hasPermission(BigInt(rows[0]['permission']), WSPermissions.Play)){
            return interaction.followUp({content:`You do not have permission to use this command!`, ephemeral: true});
        }
        
        const volume = interaction.options.getInteger('number', true);

        try {
            const queue = useQueue(interaction.guild.id);
            
            Global.Volume = volume;
            if(queue != null){
                queue.node.setVolume(Global.Volume);
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