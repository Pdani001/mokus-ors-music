const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const WSPermissions = require('../perms.js');
const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { Global } = require("../global.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Zene szüneteltetés')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),
	async execute(interaction) {
        // let's defer the interaction as things can take time to process
        await interaction.deferReply({ephemeral: true});

        const userID = interaction.member.id;
        const [rows] = await db.execute("SELECT * FROM `music_users` WHERE `user`=?",[userID]);
        if(rows.length == 0 || !WSPermissions.hasPermission(BigInt(rows[0]['permission']), WSPermissions.Play)){
            return interaction.followUp({content:`You do not have permission to use this command!`, ephemeral: true});
        }

        try {
            const queue = Global.Queue;
            if(queue == null){
                return interaction.followUp({content:`I'm not in any voice channels`, ephemeral: true});
            }

            queue.node.setPaused(!queue.node.isPaused());
            const text = queue.node.isPaused() ? "paused" : "resumed";

            return interaction.followUp({content:`Music player **${text}**`, ephemeral: true});
        } catch (e) {
            // let's return error if something failed
            return interaction.followUp({content:`Something went wrong: ${e}`, ephemeral: true});
        }
	},
};