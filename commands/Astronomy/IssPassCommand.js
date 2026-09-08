const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    category: 'Astronomy',
    data: new SlashCommandBuilder()
        .setName('iss-pass')
        .setDescription("Prévoit les prochains passages visibles de l'ISS au-dessus d'une ville")
        .addStringOption(option => 
            option.setName('city')
                .setDescription("Nom de ta ville (ex: Paris, Bruxelles, Montreal)")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        await interaction.deferReply();
        const city = interaction.options.getString('city');

        try {
            // 1. Géolocalisation de la ville via l'API Nominatim (OpenStreetMap) - Gratuit et sans clé API
            const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: { q: city, format: 'json', limit: 1 },
                headers: { 'User-Agent': 'LyamBot/1.0' }
            });

            if (!geoRes.data || geoRes.data.length === 0) {
                await interaction.editReply({ content: `❌ Impossible de trouver la ville **"${city}"**. Vérifie l'orthographe.` });
                return;
            }

            const { lat, lon, display_name } = geoRes.data[0];
            const n2yoApiKey = process.env.N2YO_API_KEY;

            if (!n2yoApiKey) {
                // Version de secours si pas de clé N2YO configurée dans le .env
                const embed = new EmbedBuilder()
                    .setTitle("🔭 Passes de l'ISS - Localisation")
                    .setDescription(`Ville trouvée : **${display_name}**`)
                    .addFields(
                        { name: "📍 Latitude / Longitude", value: `\`${lat}°, ${lon}°\``, inline: true },
                        { name: "💡 Astuce", value: "Pour obtenir les heures exactes de passage en direct, crée un compte gratuit sur [N2YO.com](https://www.n2yo.com/), récupère ta clé API et ajoute `N2YO_API_KEY=ta_cle` dans ton fichier `.env`.", inline: false }
                    )
                    .setColor(0x005288)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            // 2. Interrogation de l'API N2YO (ID de l'ISS = 25544, alt = 0, seconds = 300 pour 5 passes)
            const n2yoRes = await axios.get(`https://api.n2yo.com/rest/v1/satellite/visualpasses/25544/${lat}/${lon}/0/2/300/&apiKey=${n2yoApiKey}`);
            const passes = n2yoRes.data.passes;

            if (!passes || passes.length === 0) {
                await interaction.editReply({ content: `🔭 Aucun passage visible de l'ISS n'est prévu dans les prochains jours pour **${display_name}** (météo ou trajectoire non favorable).` });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`🔭 Prochains passages de l'ISS`)
                .setDescription(`Localisation : **${display_name}**`)
                .setColor(0x005288)
                .setTimestamp();

            // On affiche jusqu'à 3 passes maximum
            const limitPasses = passes.slice(0, 3);
            limitPasses.forEach((p, index) => {
                const startDate = new Date(p.startUTC * 1000).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
                const durationMinutes = Math.round(p.duration / 60);
                
                embed.addFields({
                    name: `Passage n°${index + 1} (${startDate})`,
                    value: `⏱️ Durée visible : **${durationMinutes} minutes**\n📈 Altitude max : **${p.maxEl}°**`,
                    inline: false
                });
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: `❌ Erreur lors du calcul des passes de l'ISS : ${error.message}` });
        }
    }
};