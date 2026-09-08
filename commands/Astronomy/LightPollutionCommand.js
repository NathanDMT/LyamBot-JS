const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    category: 'Astronomy',
    data: new SlashCommandBuilder()
        .setName('light-pollution')
        .setDescription("Estime l'indice de pollution lumineuse et l'échelle de Bortle pour une ville")
        .addStringOption(option =>
            option.setName('ville')
                .setDescription("Votre ville ou commune (ex: Lille, Chamonix, Paris)")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        await interaction.deferReply();
        const city = interaction.options.getString('ville').trim();

        try {
            // Géolocalisation via Nominatim
            const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: { q: city, format: 'json', limit: 1 },
                headers: { 'User-Agent': 'LyamBot/1.0' }
            });

            if (!geoRes.data || geoRes.data.length === 0) {
                await interaction.editReply({ content: `❌ Impossible de trouver la ville **"${city}"**.` });
                return;
            }

            const item = geoRes.data[0];
            const lat = parseFloat(item.lat);
            const locationName = item.display_name.split(',')[0];

            // Estimation basée sur la densité d'urbanisation du point géographique
            let bortleClass = 4;
            let title = "Ciel rural / de transition";
            let color = 0x2ECC71;
            let description = "Bonnes conditions. La Voie lactée est clairement visible.";

            if (Math.abs(lat - 48.8566) < 0.15 || locationName.toLowerCase().includes('paris')) {
                bortleClass = 9;
                title = "Ciel du centre-ville très pollué";
                color = 0xE74C3C;
                description = "Seules la Lune, les planètes et quelques étoiles brillantes sont visibles.";
            } else if (item.type === 'city' || item.class === 'place') {
                bortleClass = 6;
                title = "Ciel périurbain brillant";
                color = 0xF39C12;
                description = "Voie lactée presque invisible. Pollution lumineuse évidente dans toutes les directions.";
            } else if (item.type === 'village' || item.type === 'hamlet') {
                bortleClass = 3;
                title = "Ciel rural sombre";
                color = 0x1ABC9C;
                description = "Excellentes conditions d'observation. Voie lactée très détaillée.";
            }

            const embed = new EmbedBuilder()
                .setTitle(`🌌 Qualité du Ciel : ${locationName}`)
                .setDescription(`Estimation du niveau de pollution lumineuse basée sur la zone d'observation.`)
                .addFields(
                    { name: "📊 Échelle de Bortle", value: `**Classe ${bortleClass} / 9** - ${title}`, inline: false },
                    { name: "👁️ Visibilité observée", value: description, inline: false },
                    { name: "💡 Conseils", value: "Consultez la carte interactive sur [LightPollutionMap.info](https://www.lightpollutionmap.info/) pour trouver les spots les plus sombres à proximité.", inline: false }
                )
                .setColor(color)
                .setFooter({ text: "Estimation astronomique du ciel nocturne" })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Erreur LightPollution :", error);
            await interaction.editReply({
                content: `❌ Erreur lors de l'estimation de la pollution lumineuse : ${error.message}`
            });
        }
    }
};