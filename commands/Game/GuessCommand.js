const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Game',
    data: new SlashCommandBuilder()
        .setName('guess')
        .setDescription('Devine un nombre mystère entre 1 et 50')
        .addIntegerOption(option =>
            option.setName('nombre')
                .setDescription('Ton pronostic')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(50)
        ),

    async execute(interaction) {
        const userGuess = interaction.options.getInteger('nombre');
        // Génère un nombre secret (ici fixe par simplicité ou aléatoire)
        const secretNumber = Math.floor(Math.random() * 50) + 1;

        let diff = Math.abs(userGuess - secretNumber);
        let message = '';
        let color = 0x3498DB;

        if (userGuess === secretNumber) {
            message = `🎯 **Incroyable !** Tu as trouvé le nombre exact (**${secretNumber}**) !`;
            color = 0x2ECC71;
        } else if (diff <= 5) {
            message = `🔥 **C'est très chaud !** Le nombre secret était **${secretNumber}**.`;
            color = 0xE67E22;
        } else {
            message = `❄️ **C'est raté !** Le nombre secret était **${secretNumber}**.`;
            color = 0xE74C3C;
        }

        const embed = new EmbedBuilder()
            .setTitle('🔢 Jeu de la Devinette')
            .setDescription(`Tu as proposé : **${userGuess}**\n\n${message}`)
            .setColor(color)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};