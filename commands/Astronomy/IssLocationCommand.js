const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = process.env.GEOAPIFY_API_KEY || 'a44b2f32de914092ab364d84ae40215c';

module.exports = {
    // 1. Définition de la commande Slash
    data: new SlashCommandBuilder()
        .setName('iss-location')
        .setDescription("Affiche la position actuelle de la Station Spatiale Internationale"),

    // 2. Traitement initial de la commande (/iss-location)
    async execute(interaction, client) {
        await interaction.deferReply();
        const payload = await generateMessagePayload();
        await interaction.editReply(payload);
    },

    // 3. Traitement de l'interaction lors du clic sur le bouton Rafraîchir
    async handleButton(interaction, client) {
        await interaction.deferUpdate();
        const payload = await generateMessagePayload();
        await interaction.editReply(payload);
    }
};

// Génération de l'embed et téléchargement temporaire de la carte
async function generateMessagePayload() {
    let latitude = 'N/A';
    let longitude = 'N/A';
    let locationName = 'N/A';

    try {
        const res = await axios.get('http://api.open-notify.org/iss-now.json', {
            headers: { 'User-Agent': 'LyamBot/1.0' }
        });

        latitude = res.data.iss_position.latitude;
        longitude = res.data.iss_position.longitude;

        // Reverse géocoding
        locationName = "au-dessus de l’océan ou d'une zone non habitée";
        try {
            const geo = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                params: {
                    format: 'json',
                    lat: latitude,
                    lon: longitude,
                    zoom: 5,
                    addressdetails: 1
                },
                headers: { 'User-Agent': 'LyamBot/1.0' }
            });

            if (geo.data && geo.data.address && geo.data.address.country) {
                locationName = `au-dessus de ${geo.data.address.country}`;
            }
        } catch (geoError) {
            // Silencieux
        }
    } catch (error) {
        // Silencieux
    }

    const embed = new EmbedBuilder()
        .setTitle("🛰️ Position actuelle de l'ISS")
        .addFields(
            { name: "🌍 Latitude", value: String(latitude), inline: true },
            { name: "🌐 Longitude", value: String(longitude), inline: true },
            { name: "📍 Localisation", value: String(locationName), inline: false }
        )
        .setColor(0x00bfff)
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('refresh_iss')
            .setLabel('🛰️ Rafraîchir')
            .setStyle(ButtonStyle.Primary)
    );

    if (latitude === 'N/A' || longitude === 'N/A') {
        return { embeds: [embed], components: [row] };
    }

    try {
        // Téléchargement direct de l'image de la carte depuis Geoapify
        const markerParam = `lonlat:${longitude},${latitude};type:awesome;color:red;size:large`;
        const params = new URLSearchParams({
            style: 'dark-matter',
            center: `lonlat:${longitude},${latitude}`,
            zoom: '3',
            width: '600',
            height: '300',
            marker: markerParam,
            apiKey: API_KEY
        });

        const mapUrl = `https://maps.geoapify.com/v1/staticmap?${params.toString()}`;
        const imageRes = await axios.get(mapUrl, { responseType: 'arraybuffer' });

        const tempFilename = `iss_${Date.now()}.png`;
        const tempPath = path.join(os.tmpdir(), tempFilename);
        fs.writeFileSync(tempPath, imageRes.data);

        const attachment = new AttachmentBuilder(tempPath, { name: tempFilename });
        embed.setImage(`attachment://${tempFilename}`);

        // Nettoyage du fichier temporaire après 5 secondes
        setTimeout(() => {
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }, 5000);

        return {
            embeds: [embed],
            files: [attachment],
            components: [row]
        };

    } catch (error) {
        console.error("Erreur lors de la génération de la carte ISS :", error.message);
        return {
            embeds: [embed],
            components: [row]
        };
    }
}