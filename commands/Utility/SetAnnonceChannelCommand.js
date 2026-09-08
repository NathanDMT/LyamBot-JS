const { SlashCommandBuilder, EmbedBuilder, ChannelType, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');

module.exports = {
    category: 'Events',
    data: new SlashCommandBuilder()
        .setName('setannoncechannel')
        .setDescription('Définit le salon pour un ou plusieurs événements et active/désactive l’annonce')
        .addStringOption(option =>
            option.setName('event_type')
                .setDescription('Type d’événement')
                .setRequired(true)
                .addChoices(
                    { name: '🌟 Tous les événements (all)', value: 'all' },
                    { name: '📥 Arrivées (join)', value: 'join' },
                    { name: '📤 Départs (leave)', value: 'leave' },
                    { name: '🚀 Boosts (boost)', value: 'boost' }
                )
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Salon à utiliser pour cet événement')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('etat')
                .setDescription("Activer ou désactiver l'annonce de cet événement")
                .setRequired(true)
                .addChoices(
                    { name: 'activer', value: '1' },
                    { name: 'désactiver', value: '0' }
                )
        ),

    async execute(interaction, client) {
        const eventType = interaction.options.getString('event_type');
        const channel = interaction.options.getChannel('channel');
        const enabled = interaction.options.getString('etat') ?? '1';

        if (!eventType || !channel) {
            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription("Arguments manquants.")
                .setColor(0xFF0000);

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const channelId = channel.id;
        const guildId = interaction.guildId;

        try {
            const db = await getPDO();

            const eventTypes = eventType === 'all'
                ? ['join', 'leave', 'boost']
                : [eventType];

            // 💡 Requête compatible SQLite (INSERT OR REPLACE) pour remplacer ON DUPLICATE KEY UPDATE
            const query = `
                INSERT OR REPLACE INTO event_config (server_id, event_type, channel_id, enabled)
                VALUES (?, ?, ?, ?)
            `;

            for (const type of eventTypes) {
                await db.execute(query, [guildId, type, channelId, enabled]);
            }

            const typesText = eventType === 'all' ? '`join`, `leave`, `boost`' : `\`${eventType}\``;
            const etatText = enabled === '1' ? 'activés' : 'désactivés';

            const embed = new EmbedBuilder()
                .setTitle("✅ Annonces mises à jour")
                .setDescription(`Les événements ${typesText} seront envoyés dans <#${channelId}> et sont **${etatText}**.`);

            // Envoi éphémère (seul l'administrateur/utilisateur voit le message)
            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });

        } catch (e) {
            const embed = new EmbedBuilder()
                .setTitle("Erreur BDD ❌")
                .setDescription("Erreur : " + e.message)
                .setColor(0xFF0000);

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};