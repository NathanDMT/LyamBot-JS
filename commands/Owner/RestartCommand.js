const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Redémarre proprement le bot (nécessite un processus externe comme PM2 pour relancer)'),

    async execute(interaction, client) {
        const ownerId = process.env.OWNER_ID;

        if (interaction.user.id !== ownerId) {
            await interaction.reply({
                content: "❌ Tu n’as pas la permission de redémarrer le bot.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await interaction.reply({
            content: "🔁 Redémarrage du bot...",
            flags: MessageFlags.Ephemeral
        });

        console.log("🛑 Redémarrage demandé par le propriétaire");
        process.exit(0);
    }
};