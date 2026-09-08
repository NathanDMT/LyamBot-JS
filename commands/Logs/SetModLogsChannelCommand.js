const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');

module.exports = {
    // 1. Définition de la commande Slash
    data: new SlashCommandBuilder()
        .setName('setmodlogchannel')
        .setDescription('Définit le salon et les événements à logger')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Salon de log modération')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('events')
                .setDescription("Événement à suivre ou 'all' pour tous")
                .setRequired(true)
                .addChoices(
                    { name: '🌟 Tous les événements (all)', value: 'all' },
                    { name: '📥 Arrivées (join)', value: 'join' },
                    { name: '📤 Départs (leave)', value: 'leave' },
                    { name: '🚀 Boosts (boost)', value: 'boost' },
                    { name: '🛡️ Sanctions (sanction)', value: 'sanction' }
                )
        ),

    // 2. Traitement de la commande
    async execute(interaction, client) {
        const channelId = interaction.options.getChannel('channel').id;
        const eventsRaw = interaction.options.getString('events') || '';

        const validEvents = ['join', 'leave', 'boost', 'sanction'];
        let events = [];

        if (eventsRaw.trim().toLowerCase() === 'all') {
            events = validEvents;
        } else {
            events = eventsRaw.split(',').map(e => e.trim().toLowerCase());
            const invalid = events.filter(e => !validEvents.includes(e));

            if (invalid.length > 0) {
                const embed = new EmbedBuilder()
                    .setTitle("Événements invalides ❌")
                    .setDescription(`Les événements suivants sont invalides : \`${invalid.join(', ')}\`\nÉvénements valides : join, leave, boost, sanction.`)
                    .setColor(0xFF0000);

                await interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        // Vérification des permissions d'administrateur
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const embed = new EmbedBuilder()
                .setTitle("Accès refusé 🔒")
                .setDescription("Tu dois être administrateur pour définir le salon de log.")
                .setColor(0xFF0000);

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const serverId = interaction.guildId;

        try {
            const db = await getPDO();
            const query = "REPLACE INTO modlog_config (server_id, event_type, channel_id) VALUES (?, ?, ?)";
            
            for (const eventType of events) {
                await db.execute(query, [serverId, eventType, channelId]);
            }
        } catch (e) {
            console.error("❌ Erreur SQL setmodlogchannel :", e);

            const detailError = e.sqlMessage || e.message || 'Erreur inconnue BDD';

            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription(`Impossible d'enregistrer la configuration. Erreur : ${detailError}`)
                .setColor(0xFF0000);

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const channelMention = `<#${channelId}>`;
        const embed = new EmbedBuilder()
            .setTitle("✅ Configuration enregistrée")
            .setDescription(`Les événements \`${events.join(', ')}\` seront loggés dans ${channelMention}.`)
            .setColor(0x00FF00);

        await interaction.reply({
            embeds: [embed]
        });
    }
};