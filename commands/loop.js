const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const WSPermissions = require('../perms.js');
const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const { Global } = require("../global.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('loop')
		.setDescription('Zene lejátszó ismétlési mód változtatása')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .addIntegerOption(option=>
            option.setName("mode")
            .setDescription("Ismétlési mód")
            .setMinValue(0)
            .setMaxValue(2)
            .setRequired(true)
            .addChoices(
                {name: 'Kikapcsolva', value: 0}, // Off
                {name: 'Jelenlegi szám', value: 1}, // Track
                {name: 'Lejátszási lista', value: 2}, // Queue
            )),
	async execute(interaction) {
        // let's defer the interaction as things can take time to process
        await interaction.deferReply({ephemeral: true});

        const userID = interaction.member.id;
        const [rows] = await db.execute("SELECT * FROM `music_users` WHERE `user`=?",[userID]);
        if(rows.length == 0 || !WSPermissions.hasPermission(BigInt(rows[0]['permission']), WSPermissions.Play)){
            return interaction.followUp({content:`You do not have permission to use this command!`, ephemeral: true});
        }
        
        const mode = interaction.options.getInteger('mode', true);

        try {
            const queue = Global.Queue;

            Global.RepeatMode = mode;
            if(queue != null){
                queue.setRepeatMode(Global.RepeatMode);
            }
            interaction.client.broadcastWS({
                event: 'repeatMode',
                repeat: Global.RepeatMode
            });
            const text = mode == 0 ? "Off" : mode == 1 ? "Track" : "Queue";

            return interaction.followUp({content:`Loop mode set to **${text}%**`, ephemeral: true});
        } catch (e) {
            // let's return error if something failed
            return interaction.followUp({content:`Something went wrong: ${e}`, ephemeral: true});
        }
	},
};