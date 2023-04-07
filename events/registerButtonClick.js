const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isButton()) return;

		if(interaction.customId != "registerButton")
			return await interaction.reply({content: 'Invalid button', ephemeral: true});

        interaction.update({ content: 'Registration started.', components: [] });

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