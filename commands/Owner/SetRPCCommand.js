const { SlashCommandBuilder, EmbedBuilder, ActivityType, MessageFlags } = require('discord.js');

module.exports = {
    category: 'Owner',
    data: new SlashCommandBuilder()
        .setName('setrpc')
        .setDescription("Modifie en détail le Rich Presence (statut, images et détails) du bot")
        .addStringOption(option =>
            option.setName('type')
                .setDescription("Le type d'activité")
                .setRequired(true)
                .addChoices(
                    { name: '🎮 Jeu (Playing)', value: 'Playing' },
                    { name: '📺 Streaming (Streaming)', value: 'Streaming' },
                    { name: '🎧 Écoute (Listening)', value: 'Listening' },
                    { name: '🎬 Regarde (Watching)', value: 'Watching' },
                    { name: '🏆 Compétition (Competing)', value: 'Competing' },
                    { name: '👤 Personnalisé (Custom)', value: 'Custom' }
                )
        )
        .addStringOption(option =>
            option.setName('texte')
                .setDescription("Le texte principal / nom de l'activité (ex: Playing Solo)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('details')
                .setDescription("Le texte secondaire / détails (ex: Competitive)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('large_image_key')
                .setDescription("La clé de la grande image (définie sur le Developer Portal)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('large_image_text')
                .setDescription("Le texte affiché au survol de la grande image (ex: Numbani)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('small_image_key')
                .setDescription("La clé de la petite image (définie sur le Developer Portal)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('small_image_text')
                .setDescription("Le texte affiché au survol de la petite image")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('url')
                .setDescription("URL du stream (requis uniquement si type = Streaming)")
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const ownerId = process.env.OWNER_ID;

        // Vérification de l'Owner
        if (interaction.user.id !== ownerId) {
            const embed = new EmbedBuilder()
                .setTitle("Accès refusé 🔒")
                .setDescription("Seul le propriétaire du bot peut utiliser cette commande.")
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        const typeStr = interaction.options.getString('type');
        const text = interaction.options.getString('texte');
        const details = interaction.options.getString('details');
        const largeImageKey = interaction.options.getString('large_image_key');
        const largeImageText = interaction.options.getString('large_image_text');
        const smallImageKey = interaction.options.getString('small_image_key');
        const smallImageText = interaction.options.getString('small_image_text');
        const streamUrl = interaction.options.getString('url');

        // Conversion du type string en ActivityType de discord.js
        let activityType;
        switch (typeStr) {
            case 'Playing': activityType = ActivityType.Playing; break;
            case 'Streaming': activityType = ActivityType.Streaming; break;
            case 'Listening': activityType = ActivityType.Listening; break;
            case 'Watching': activityType = ActivityType.Watching; break;
            case 'Competing': activityType = ActivityType.Competing; break;
            case 'Custom': activityType = ActivityType.Custom; break;
            default: activityType = ActivityType.Playing;
        }

        try {
            const activityOptions = {
                name: text,
                type: activityType,
            };

            // Ajout optionnel des détails (state) et des assets images si renseignés
            if (details) activityOptions.state = details;
            if (largeImageKey) activityOptions.largeImage = largeImageKey;
            if (largeImageText) activityOptions.largeImageText = largeImageText;
            if (smallImageKey) activityOptions.smallImage = smallImageKey;
            if (smallImageText) activityOptions.smallImageText = smallImageText;

            const presenceOptions = {
                activities: [activityOptions]
            };

            // Gestion de l'URL pour le mode Streaming
            if (activityType === ActivityType.Streaming) {
                if (!streamUrl) {
                    await interaction.reply({
                        content: "❌ Tu dois fournir une URL de stream valide (ex: https://twitch.tv/moncompte) pour le type Streaming.",
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
                presenceOptions.activities[0].url = streamUrl;
            }

            // Application de la présence enrichie au bot
            client.user.setPresence(presenceOptions);

            const embed = new EmbedBuilder()
                .setTitle("✨ Rich Presence Avancé mis à jour")
                .setDescription(`Le statut détaillé du bot a été configuré avec succès !`)
                .addFields(
                    { name: "Type", value: typeStr, inline: true },
                    { name: "Texte Principal", value: text, inline: true },
                    { name: "Détails (State)", value: details || "Aucun", inline: true },
                    { name: "Grande Image (Key)", value: largeImageKey || "Aucune", inline: true },
                    { name: "Petite Image (Key)", value: smallImageKey || "Aucune", inline: true }
                )
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `❌ Une erreur est survenue lors de la configuration du Rich Presence : ${error.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};