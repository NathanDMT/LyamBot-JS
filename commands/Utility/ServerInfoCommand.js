const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Affiche des informations sur le serveur'),

    async execute(interaction, client) {
        const guild = interaction.guild;

        if (!guild) {
            await interaction.reply({
                content: "❌ Impossible de récupérer les informations du serveur.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Discord Snowflake vers Unix Timestamp
        const timestamp = Math.floor(Number(BigInt(guild.id) >> 22n) / 1000 + 1420070400);
        const formattedCreation = `<t:${timestamp}:F>`;

        const locales = {
            'en-US': '🇺🇸 Etats-Unis',
            'en-GB': '🇬🇧 Royaume-Uni',
            'fr': '🇫🇷 France',
            'de': '🇩🇪 Allemagne',
            'es-ES': '🇪🇸 Espagne',
            'it': '🇮🇹 Italie',
            'ja': '🇯🇵 Japon',
            'ko': '🇰🇷 Corée',
            'pt-BR': '🇧🇷 Portugal (Brésil)',
            'pt-PT': 'Portugal',
            'ru': '🇷🇺 Russie',
            'zh-CN': '🇨🇳 Chine',
        };

        const locale = guild.preferredLocale || 'unknown';
        const regionDisplay = locales[locale] || "🌍 Inconnue";

        const embed = new EmbedBuilder()
            .setTitle("📊 Informations du serveur")
            .setDescription(`Voici les informations de **${guild.name}**`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setColor(0x00AAFF)
            .addFields(
                { name: "🆔 ID", value: guild.id, inline: true },
                { name: "👑 Propriétaire", value: `<@${guild.ownerId}>`, inline: true },
                { name: "👥 Membres", value: String(guild.memberCount ?? 'Chargement...'), inline: true },
                { name: "📅 Création", value: formattedCreation, inline: true },
                { name: "🌍 Pays", value: regionDisplay, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};