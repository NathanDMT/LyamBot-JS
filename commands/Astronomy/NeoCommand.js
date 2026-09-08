const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    category: 'Astronomy',
    // 1. Définition de la commande Slash
    data: new SlashCommandBuilder()
        .setName('neo')
        .setDescription("Liste les astéroïdes géocroiseurs s'approchant de la Terre aujourd'hui"),

    // 2. Exécution de la commande
    async execute(interaction, client) {
        await interaction.deferReply();

        const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
        const today = new Date().toISOString().slice(0, 10); // Format AAAA-MM-JJ

        try {
            // Appel à l'API NASA NeoWs
            const response = await axios.get('https://api.nasa.gov/neo/rest/v1/feed', {
                params: {
                    start_date: today,
                    end_date: today,
                    api_key: apiKey
                }
            });

            const nearEarthObjects = response.data.near_earth_objects[today];

            if (!nearEarthObjects || nearEarthObjects.length === 0) {
                await interaction.editReply({ 
                    content: "☄️ Aucun géocroiseur répertorié par la NASA pour aujourd'hui !" 
                });
                return;
            }

            // Sélection des 5 premiers astéroïdes de la journée
            const topAsteroids = nearEarthObjects.slice(0, 5);

            const embed = new EmbedBuilder()
                .setTitle(`☄️ Géocroiseurs proches de la Terre (${today})`)
                .setDescription(`La NASA a détecté **${nearEarthObjects.length}** astéroïde(s) croisant la zone terrestre aujourd'hui. Voici les **${topAsteroids.length}** plus récents :`)
                .setColor(0xE67E22)
                .setFooter({ text: "Source : NASA NeoWs • (1 LD = 1 Distance Lunaires ≈ 384 400 km)" })
                .setTimestamp();

            topAsteroids.forEach((asteroid, index) => {
                const name = asteroid.name;
                const isHazardous = asteroid.is_potentially_hazardous_asteroid;
                const hazardStatus = isHazardous ? "⚠️ **POTENTIELLEMENT DANGEREUX**" : "🟢 Risque négligeable";

                const closeData = asteroid.close_approach_data[0];
                const distKm = Math.round(parseFloat(closeData.miss_distance.kilometers)).toLocaleString('fr-FR');
                const distLunar = parseFloat(closeData.miss_distance.lunar).toFixed(1);
                const speed = Math.round(parseFloat(closeData.relative_velocity.kilometers_per_hour)).toLocaleString('fr-FR');

                const minDiameter = Math.round(asteroid.estimated_diameter.meters.estimated_diameter_min);
                const maxDiameter = Math.round(asteroid.estimated_diameter.meters.estimated_diameter_max);

                embed.addFields({
                    name: `${index + 1}. Astéroïde ${name} ${isHazardous ? '⚠️' : ''}`,
                    value: `📏 **Taille estimée** : ${minDiameter} à ${maxDiameter} mètres\n` +
                           `📐 **Distance de passage** : ${distKm} km (${distLunar} LD)\n` +
                           `🚀 **Vitesse** : ${speed} km/h\n` +
                           `🛡️ **Statut** : ${hazardStatus}`,
                    inline: false
                });
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Erreur NEO :", error);
            await interaction.editReply({
                content: `❌ Erreur lors de la récupération des géocroiseurs : ${error.message}`
            });
        }
    }
};