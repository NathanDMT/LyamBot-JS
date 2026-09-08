const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const SpaceWeatherParser = require('../../utils/SpaceWeatherParser');

module.exports = {
    category: 'Astronomy',
    data: new SlashCommandBuilder()
        .setName('spaceweather')
        .setDescription("Affiche l'activité solaire et le risque d'aurores boréales")
        .addStringOption(option =>
            option.setName('ville')
                .setDescription("Votre ville pour estimer la visibilité (optionnel)")
                .setRequired(false)
        ),

    async execute(interaction, client) {
        await interaction.deferReply();

        const ville = interaction.options.getString('ville');
        let userLat = 48.85; 
        let locationName = "France / Europe (Par défaut)";

        if (ville) {
            try {
                const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: { q: ville, format: 'json', limit: 1 },
                    headers: { 'User-Agent': 'LyamBot/1.0' }
                });

                if (geoRes.data && geoRes.data.length > 0) {
                    userLat = parseFloat(geoRes.data[0].lat);
                    locationName = geoRes.data[0].display_name.split(',')[0];
                }
            } catch (e) {}
        }

        console.log(`[DEBUG Exec] Lancement de la commande spaceweather (Ville: ${locationName})`);

        const currentKp = await SpaceWeatherParser.getKp();
        const latestFlare = await SpaceWeatherParser.getLatestFlare();

        console.log(`[DEBUG Exec] Kp reçu dans la commande : "${currentKp}"`);

        let auroraStatus = "Activité calme 🟢";
        let color = 0x00FF00;
        const kpNum = parseFloat(currentKp);

        if (!isNaN(kpNum)) {
            let requiredKp = 7;
            if (userLat >= 60) requiredKp = 5;
            else if (userLat >= 50) requiredKp = 6;

            if (kpNum >= requiredKp) {
                auroraStatus = `Tempête géomagnétique active ! Aurores probables à **${locationName}** ! 🌌🔥`;
                color = 0xFF4500;
            } else if (kpNum >= requiredKp - 1) {
                auroraStatus = `Activité modérée / Seuil d'aurores possible 🟡`;
                color = 0xFFD700;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle("☀️ Météo Spatiale & Aurores Boréales")
            .setDescription(`Données en direct pour la zone : **${locationName}**`)
            .addFields(
                { name: "⚡ Indice Kp Actuel", value: `\`${currentKp}\` / 9`, inline: true },
                { name: "🌌 Statut Aurores", value: auroraStatus, inline: false },
                { name: "🔥 Dernière Éruption Solaire", value: latestFlare, inline: false }
            )
            .setColor(color)
            .setFooter({ text: "Sources : NordAPI, GFZ & NOAA" })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};