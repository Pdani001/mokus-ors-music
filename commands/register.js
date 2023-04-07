const { SlashCommandBuilder, TextInputStyle, ModalBuilder, TextInputBuilder, ActionRowBuilder, PermissionsBitField } = require('discord.js');
const db = require("../connection.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Zene lejátszó felhasználó regisztrálása')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),
	async execute(interaction) {
        const modal = new ModalBuilder()
			.setCustomId('registerModal')
			.setTitle('Zene lejátszó regisztráció');
        const nameInput = new TextInputBuilder()
			.setCustomId('nameInput')
			.setLabel("Felhasználónév")
			.setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(72);
        const passInput = new TextInputBuilder()
			.setCustomId('passwordInput')
			.setLabel("Jelszó")
			.setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(8);
        const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
		const secondActionRow = new ActionRowBuilder().addComponents(passInput);
        modal.addComponents(firstActionRow, secondActionRow);

        return await interaction.showModal(modal);
	},
};