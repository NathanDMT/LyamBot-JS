const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Arrête le bot (owner uniquement)'),

    async execute(interaction, client) {
        const ownerId = process.env.OWNER_ID;

        if (interaction.user.id !== ownerId) {
            await interaction.reply({
                content: "❌ Seul le propriétaire du bot peut exécuter cette commande."
            });
            return;
        }

        await interaction.deferReply();

        await interaction.followUp({
            content: "🛑 Le bot s’arrête dans 1 seconde..."
        });

        setTimeout(async () => {
            await client.destroy();
            process.exit(0);
        }, 1000);
    }
};