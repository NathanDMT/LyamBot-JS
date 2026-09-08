const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');

module.exports = {
    category: 'Astronomy',
    data: new SlashCommandBuilder()
        .setName('setastrochannels')
        .setDescription("Définit les salons où l'APOD et/ou l'image du JWST seront envoyées quotidiennement")
        .addChannelOption(option =>
            option.setName('apod')
                .setDescription("Salon d'envoi de l'image APOD (NASA)")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(false)
        )
        .addChannelOption(option =>
            option.setName('jwst')
                .setDescription("Salon d'envoi de l'image du JWST")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(false)
        ),

    async execute(interaction, client) {
        // Vérification des permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "🔒 Tu dois être administrateur pour utiliser cette commande.",
                flags: MessageFlags.Ephemeral
            });
        }

        const apodChannel = interaction.options.getChannel('apod');
        const jwstChannel = interaction.options.getChannel('jwst');

        // L'utilisateur doit obligatoirement configurer au moins un des deux salons
        if (!apodChannel && !jwstChannel) {
            return interaction.reply({
                content: "⚠️ Tu dois spécifier au moins un salon (APOD ou JWST) pour utiliser cette commande.",
                flags: MessageFlags.Ephemeral
            });
        }

        const serverId = interaction.guildId;

        try {
            const db = await getPDO();
            let descriptionConfig = "";

            // Syntaxe SQLite INSERT OR REPLACE adaptée[cite: 4]
            if (apodChannel) {
                const queryApod = "INSERT OR REPLACE INTO apod_config (server_id, channel_id) VALUES (?, ?)";
                await db.execute(queryApod, [serverId, apodChannel.id]);
                descriptionConfig += `🌌 L'image **APOD** sera envoyée dans <#${apodChannel.id}>\n`;
            }

            if (jwstChannel) {
                const queryJwst = "INSERT OR REPLACE INTO jwst_config (server_id, channel_id) VALUES (?, ?)";
                await db.execute(queryJwst, [serverId, jwstChannel.id]);
                descriptionConfig += `🔭 L'image **JWST** sera envoyée dans <#${jwstChannel.id}>\n`;
            }

            const embed = new EmbedBuilder()
                .setTitle("✅ Configuration Astronomie enregistrée")
                .setDescription(descriptionConfig)
                .setColor(0x00FF00);

            await interaction.reply({ embeds: [embed] });

        } catch (e) {
            console.error("❌ Erreur SQL setastrochannels :", e);
            await interaction.reply({
                content: `❌ Impossible d'enregistrer la configuration : ${e.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};