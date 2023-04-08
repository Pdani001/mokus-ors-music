const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require('discord.js');
const db = require("../connection.js");
const WSPermissions = require('../perms.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Zene lejátszó felhasználó regisztrálása')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),
	async execute(interaction) {
		await interaction.deferReply({ephemeral: true});

        const userID = interaction.member.id;
        const [rows] = await db.execute("SELECT * FROM `music_users` WHERE `user`=?",[userID]);
        if(rows.length != 0){
			const button = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setLabel('Login')
					.setStyle(ButtonStyle.Link)
					.setURL("https://mokus.pghost.org/"),
			);
            return interaction.followUp({
				content:`You already have an account!`,
				ephemeral: true,
				components: WSPermissions.has(BigInt(rows[0]['permission']),WSPermissions.Bits.Login) ? [button] : []
			});
        }

		const button = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('registerButton')
					.setLabel('Register')
					.setStyle(ButtonStyle.Primary),
			);
        
		return interaction.followUp({content:`Click the button to create a new account!`, ephemeral: true, components: [button]});
	},
};