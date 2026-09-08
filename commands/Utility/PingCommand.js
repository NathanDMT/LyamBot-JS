const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Affiche le ping de la connexion du bot.'),

    async execute(interaction, client) {
        const start = Date.now();

        // Première réponse privée (éphémère)
        await interaction.reply({ 
            content: '⏳ Calcul du ping...',
            flags: MessageFlags.Ephemeral 
        });

        const latence = Date.now() - start;

        const embed = new EmbedBuilder()
            .setTitle("🏓 Pong !")
            .addFields({ name: "Latence HTTP", value: `${latence}ms`, inline: true })
            .setColor(0x00FFCC)
            .setTimestamp();

        // Édition du message privé
        await interaction.editReply({
            content: null,
            embeds: [embed]
        });
    }
};