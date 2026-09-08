const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // 1. Définition de la commande Slash (register)
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Lance un dé à 6 faces'),

    // 2. Traitement de la commande (handle)
    async execute(interaction, client) {
        // Génère un entier aléatoire entre 1 et 6 (équivalent strict de rand(1, 6) en PHP)
        const roll = Math.floor(Math.random() * 6) + 1;

        await interaction.reply({
            content: `🎲 Tu as lancé un **${roll}** !`
        });
    }
};