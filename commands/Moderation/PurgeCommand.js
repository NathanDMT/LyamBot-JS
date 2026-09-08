const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Supprime un certain nombre de messages récents')
        .addIntegerOption(option =>
            option.setName('nombre')
                .setDescription('Nombre de messages à supprimer (1 à 100)')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const nombre = interaction.options.getInteger('nombre');

        if (nombre < 1 || nombre > 100) {
            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription("Le nombre doit être entre 1 et 100.")
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const embed = new EmbedBuilder()
                .setTitle("Accès refusé 🔒")
                .setDescription("Tu n’as pas la permission de gérer les messages.")
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            const deletedMessages = await interaction.channel.bulkDelete(nombre, true);

            const embed = new EmbedBuilder()
                .setTitle("🧹 Purge terminée")
                .setDescription(`**${deletedMessages.size}** message(s) supprimé(s).`)
                .setColor(0x00FF00);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

        } catch (e) {
            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription("Une erreur est survenue lors de la suppression des messages (les messages datant de plus de 14 jours ne peuvent pas être supprimés en masse).")
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};