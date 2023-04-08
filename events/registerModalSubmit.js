const { Events, PermissionsBitField } = require('discord.js');
const WSPermissions = require('../perms.js');
const db = require("../connection.js");
const { CurrentDate } = require('../util.js');
const bcrypt = require("bcrypt");
const uuid = require("uuid").v4;

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isModalSubmit()) return;

		if(interaction.customId != "registerModal")
			return await interaction.reply({content: 'Invalid modal', ephemeral: true});

		// let's defer the interaction as things can take time to process
        await interaction.deferReply({ephemeral: true});

        const userID = interaction.member.id;

		let perms = 0n;
        if(interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers,false)){
            perms = WSPermissions.Bits.Play;
        }
        if(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator,false)){
            perms = WSPermissions.All;
        }

        const name = interaction.fields.getTextInputValue("nameInput");
        if(name.length < 3 || name.length > 72){
            return interaction.followUp({content:`The length of your username must be between 3 and 72 characters`, ephemeral: true});
        }
        [rows] = await db.execute("SELECT * FROM `music_users` WHERE `name`=?",[name]);
        if(rows.length != 0){
            return interaction.followUp({content:`This username is already in use`, ephemeral: true});
        }

        let password = interaction.fields.getTextInputValue("passwordInput");
        if(password.length < 8){
            return interaction.followUp({content:`The length of the password must be at least 8 characters`, ephemeral: true});
        }
        password = await bcrypt.hash(password,9);

        try {
            await db.execute("INSERT INTO `music_users` (`id`,`name`,`password`,`user`,`permission`) VALUES (?,?,?,?,?)",[uuid(),name,password,userID,perms]);
			console.log(CurrentDate()+`User ${userID} registered music player account '${name}' with perms '${perms}'`);
            return interaction.followUp({content:`Successfully registered a new music player account!`, ephemeral: true});
        } catch (e) {
            // let's return error if something failed
            return interaction.followUp({content:`Something went wrong: ${e}`, ephemeral: true});
        }
	},
};