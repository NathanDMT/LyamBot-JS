const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Cache mémoire pour les images
const imageCache = new Map();

module.exports = {
    // 1. Définition de la commande Slash
    data: new SlashCommandBuilder()
        .setName('apod')
        .setDescription("Image astronomique du jour ou d'une date précise (NASA APOD)")
        .addStringOption(option =>
            option.setName('date')
                .setDescription("Date au format JJ-MM-AAAA (optionnel, par défaut : aujourd'hui)")
                .setRequired(false)
        ),

    // 2. Traitement de la commande principal (handle)
    async execute(interaction, client) {
        await interaction.deferReply();

        const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
        
        // Date par défaut : aujourd'hui au format YYYY-MM-DD pour l'API
        let apiDate = new Date().toISOString().slice(0, 10);
        const inputDate = interaction.options.getString('date');
        
        // Si une date est saisie au format JJ-MM-AAAA, on la convertit en AAAA-MM-JJ pour l'API NASA
        if (inputDate) {
            const match = inputDate.match(/^(\d{2})-(\d{2})-(\d{4})$/);
            if (match) {
                const day = match[1];
                const month = match[2];
                const year = match[3];
                apiDate = `${year}-${month}-${day}`;
            }
        }

        try {
            // Appels HTTP via Axios
            const response = await axios.get('https://api.nasa.gov/planetary/apod', {
                params: {
                    api_key: apiKey,
                    date: apiDate
                }
            });

            const data = response.data;
            const imageUrl = data.url || data.hdurl || null;

            const embed = new EmbedBuilder()
                .setTitle(data.title || 'APOD')
                .setURL(data.url || null)
                .setDescription(data.explanation ? data.explanation.substring(0, 4000) : '')
                .setColor(0x005288)
                .setFooter({ text: `Astronomy Picture of the Day • ${data.date}` });

            if (data.media_type === 'image' && imageUrl && /\.(jpg|jpeg|png|gif)$/i.test(imageUrl)) {
                // Téléchargement temporaire de l'image
                const tempFilename = `apod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
                const tempPath = path.join(os.tmpdir(), tempFilename);

                const imageStream = await axios({
                    url: imageUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                const writer = fs.createWriteStream(tempPath);
                imageStream.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                const attachment = new AttachmentBuilder(tempPath, { name: tempFilename });
                embed.setImage(`attachment://${tempFilename}`);

                await interaction.editReply({
                    embeds: [embed],
                    files: [attachment]
                });

                // Nettoyage du fichier temporaire après 5 secondes
                setTimeout(() => {
                    if (fs.existsSync(tempPath)) {
                        fs.unlinkSync(tempPath);
                    }
                }, 5000);

            } else if (data.media_type === 'video') {
                embed.addFields({ name: '🎬 Vidéo', value: data.url });

                const ytMatch = data.url.match(/youtube\.com.*?[?&]v=([^&]+)/) || data.url.match(/youtu\.be\/([^?]+)/);
                if (ytMatch) {
                    const videoId = ytMatch[1];
                    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    embed.setImage(thumbnail);
                }

                await interaction.editReply({
                    embeds: [embed]
                });

            } else {
                await interaction.editReply({
                    content: `❌ Média non supporté : ${data.media_type}`
                });
            }

        } catch (error) {
            await interaction.followUp({
                content: `❌ Erreur APOD : ${error.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    },

    // 3. Gestionnaire des clics boutons (handleButton)
    async handleButton(interaction, client) {
        const customId = interaction.customId;

        if (!customId.startsWith('apod_show_image_')) {
            return;
        }

        const id = customId.replace('apod_show_image_', '');
        const imageUrl = imageCache.get(id);

        if (!imageUrl) {
            await interaction.reply({
                content: "❌ Image expirée ou non disponible.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await interaction.reply({
            content: `🖼️ Voici l’image du jour : ${imageUrl}`
        });
    }
};