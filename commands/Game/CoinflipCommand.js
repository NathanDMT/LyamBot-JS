const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // 1. Définition de la commande Slash (register)
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Lance une pièce et retourne pile ou face'),

    // 2. Traitement de la commande (handle)
    async execute(interaction, client) {
        // Math.random() < 0.5 équivaut à rand(0, 1) === 0
        const result = Math.random() < 0.5 ? '🪙 Pile !' : '🪙 Face !';

        await interaction.reply({
            content: `Résultat : **${result}**`
        });
    }
};