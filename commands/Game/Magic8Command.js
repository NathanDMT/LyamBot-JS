const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const answers = [
    "C'est certain. ✨",
    "Sans aucun doute. 👍",
    "Oui, absolument. ✅",
    "C'est parti pour, oui. 🌟",
    "Peut-être bien... 🤔",
    "Redemande plus tard. ⏳",
    "Je ne peux pas prédire maintenant. 🔮",
    "Concentre-toi et redemande. 🧘‍♂️",
    "N'y compte pas. ❌",
    "Mes sources disent que non. 🛑",
    "Les perspectives ne sont pas très bonnes. 📉",
    "Très improbable. 👎"
];

module.exports = {
    category: 'Game',
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Pose une question à la boule magique')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Ta question par oui ou par non')
                .setRequired(true)
        ),

    async execute(interaction) {
        const question = interaction.options.getString('question');
        const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

        const embed = new EmbedBuilder()
            .setTitle('🎱 Boule Magique 8-Ball')
            .addFields(
                { name: '❓ Question', value: question },
                { name: '🔮 Réponse', value: randomAnswer }
            )
            .setColor(0x9B59B6)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};