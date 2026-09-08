const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

// On stocke la date de démarrage à l'initialisation du fichier
const startTime = new Date();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription("Affiche depuis combien de temps le bot est en ligne"),

    async execute(interaction, client) {
        const ownerId = process.env.OWNER_ID;

        if (interaction.user.id !== ownerId) {
            const embed = new EmbedBuilder()
                .setTitle("🚫 Accès refusé")
                .setDescription("Tu n'es pas autorisé à utiliser cette commande.")
                .setColor(0xFF5555)
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const now = new Date();
        const diffMs = now - startTime;

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
        const seconds = Math.floor((diffMs / 1000) % 60);

        const uptime = `${days} jours, ${hours} heures, ${minutes} minutes, ${seconds} secondes`;

        const embed = new EmbedBuilder()
            .setTitle("🟢 Uptime du bot")
            .setDescription(`En ligne depuis :\n\`${uptime}\``)
            .setColor(0x00FF88)
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
};