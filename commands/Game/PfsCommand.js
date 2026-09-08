const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const choices = [
    { name: 'Pierre 🪨', value: 'pierre', beats: 'ciseaux' },
    { name: 'Papier 📄', value: 'papier', beats: 'pierre' },
    { name: 'Ciseaux ✂️', value: 'ciseaux', beats: 'papier' }
];

module.exports = {
    category: 'Game',
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Affronte le bot à pierre, papier, ciseaux !')
        .addStringOption(option =>
            option.setName('choix')
                .setDescription('Ton choix')
                .setRequired(true)
                .addChoices(
                    { name: 'Pierre 🪨', value: 'pierre' },
                    { name: 'Papier 📄', value: 'papier' },
                    { name: 'Ciseaux ✂️', value: 'ciseaux' }
                )
        ),

    async execute(interaction) {
        const userChoiceValue = interaction.options.getString('choix');
        const userChoice = choices.find(c => c.value === userChoiceValue);
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        let resultText = '';
        let color = 0xF1C40F; // Égalité

        if (userChoice.value === botChoice.value) {
            resultText = "🤝 **Égalité !** Vous avez fait le même choix.";
        } else if (userChoice.beats === botChoice.value) {
            resultText = "🎉 **Tu as gagné !** Bien joué.";
            color = 0x2ECC71;
        } else {
            resultText = "😢 **Tu as perdu !** Le bot l'emporte.";
            color = 0xE74C3C;
        }

        const embed = new EmbedBuilder()
            .setTitle('🪨 Pierre - Papier - Ciseaux ✂️')
            .addFields(
                { name: 'Ton choix', value: userChoice.name, inline: true },
                { name: 'Choix du bot', value: botChoice.name, inline: true },
                { name: 'Résultat', value: resultText, inline: false }
            )
            .setColor(color)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};