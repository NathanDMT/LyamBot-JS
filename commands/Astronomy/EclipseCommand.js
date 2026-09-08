const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    category: 'Astronomy',
    // 1. Définition de la commande Slash avec les options de position
    data: new SlashCommandBuilder()
        .setName('eclipses')
        .setDescription("Affiche les prochaines éclipses solaires et lunaires sur les 20 prochaines années pour votre ville")
        .addStringOption(option =>
            option.setName('ville')
                .setDescription("Nom de votre ville (ex: Paris, Montréal, Dakar)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('detail')
                .setDescription("Code postal ou pays pour affiner (optionnel, ex: France)")
                .setRequired(false)
        ),

    // 2. Exécution de la commande
    async execute(interaction, client) {
        await interaction.deferReply();

        const city = interaction.options.getString('ville');
        const detail = interaction.options.getString('detail') || '';
        const searchQuery = `${city}, ${detail}`.trim();

        try {
            // Géocodage de la position de l'utilisateur via Nominatim (OpenStreetMap)
            const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: { q: searchQuery, format: 'json', limit: 1 },
                headers: { 'User-Agent': 'LyamBot/1.0' }
            });

            if (!geoRes.data || geoRes.data.length === 0) {
                await interaction.editReply({ 
                    content: `❌ Impossible de trouver la localité **"${searchQuery}"**. Vérifiez l'orthographe.` 
                });
                return;
            }

            const locationInfo = geoRes.data[0];
            const displayName = locationInfo.display_name;
            const userContext = displayName.toLowerCase();

            // Base de données étendue des éclipses majeures (Solaires et Lunaires) de 2026 à 2045+
            const eclipsesList = [
                {
                    name: "☀️ Éclipse Solaire Annulaire",
                    date: "17 février 2026",
                    type: "Annulaire / Partielle",
                    visibility: "Sud du Chili, Argentine, Antarctique et Afrique australe",
                    keywords: ["chili", "argentine", "antarctique", "afrique", "south africa", "chile"]
                },
                {
                    name: "🌕 Éclipse Lunaire Totale",
                    date: "3 mars 2026",
                    type: "Totale",
                    visibility: "Asie, Australie, Pacifique, Amériques",
                    keywords: ["asie", "australie", "pacifique", "amérique", "americas", "usa", "canada", "mexique", "japon", "chine"]
                },
                {
                    name: "☀️ Éclipse Solaire Totale",
                    date: "12 août 2026",
                    type: "Totale",
                    visibility: "Groenland, Islande, nord de l'Espagne, Portugal et Atlantique Nord",
                    keywords: ["groenland", "islande", "espagne", "portugal", "spain", "iceland", "greenland", "europe"]
                },
                {
                    name: "🌕 Éclipse Lunaire Partielle",
                    date: "28 août 2026",
                    type: "Partielle",
                    visibility: "Amériques, Europe de l'Ouest et Afrique de l'Ouest",
                    keywords: ["amérique", "americas", "europe", "france", "espagne", "royaume-uni", "uk", "allemagne", "portugal", "afrique", "maroc", "sénégal"]
                },
                {
                    name: "☀️ Éclipse Solaire Totale",
                    date: "2 août 2027",
                    type: "Totale",
                    visibility: "Espagne, Gibraltar, Nord de l'Afrique (Maroc, Algérie, Égypte), Moyen-Orient",
                    keywords: ["espagne", "spain", "maroc", "algérie", "égypte", "egypt", "arabie", "moyen-orient", "europe", "afrique"]
                },
                {
                    name: "☀️ Éclipse Solaire Totale",
                    date: "22 juillet 2028",
                    type: "Totale",
                    visibility: "Australie et Nouvelle-Zélande",
                    keywords: ["australie", "australia", "nouvelle-zélande", "new zealand", "océanie"]
                },
                {
                    name: "☀️ Éclipse Solaire Annulaire",
                    date: "1 juin 2030",
                    type: "Annulaire",
                    visibility: "Afrique du Nord, Europe de l'Est, Russie, Asie",
                    keywords: ["afrique", "europe", "russie", "asie", "france", "algérie", "tunisie"]
                },
                {
                    name: "☀️ Éclipse Solaire Totale",
                    date: "13 novembre 2031",
                    type: "Totale",
                    visibility: "Panama, Amérique du Sud, Atlantique",
                    keywords: ["panama", "amérique du sud", "south america", "colombie", "brésil"]
                },
                {
                    name: "☀️ Éclipse Solaire Totale",
                    date: "30 mars 2033",
                    type: "Totale",
                    visibility: "Russie (Sibirée), Alaska (USA)",
                    keywords: ["russie", "russia", "alaska", "usa", "états-unis"]
                },
                {
                    name: "☀️ Éclipse Solaire Totale",
                    date: "20 mars 2034",
                    type: "Totale",
                    visibility: "Afrique centrale, Égypte, Arabie Saoudite, Iran, Inde",
                    keywords: ["afrique", "égypte", "egypt", "arabie", "inde", "india", "iran"]
                },
                {
                    name: "☀️ Éclipse Solaire Totale",
                    date: "2 septembre 2035",
                    type: "Totale",
                    visibility: "Chine, Corée du Nord, Japon, Pacifique",
                    keywords: ["chine", "china", "japon", "japan", "corée"]
                },
                {
                    name: "☀️ Éclipse Solaire Totale",
                    date: "13 juillet 2037",
                    type: "Totale",
                    visibility: "Australie et Nouvelle-Zélande",
                    keywords: ["australie", "australia", "nouvelle-zélande", "new zealand"]
                },
                {
                    name: "☀️ Éclipse Solaire Totale",
                    date: "26 décembre 2038",
                    type: "Totale",
                    visibility: "Australie, Nouvelle-Zélande, Pacifique Sud",
                    keywords: ["australie", "australia", "nouvelle-zélande", "new zealand"]
                },
                {
                    name: "☀️ Éclipse Solaire Totale",
                    date: "12 août 2045",
                    type: "Totale",
                    visibility: "États-Unis, Caraïbes, Amérique du Sud (Brésil)",
                    keywords: ["états-unis", "usa", "united states", "brésil", "brazil", "caraïbes", "amérique"]
                }
            ];

            // Filtrage des éclipses visibles pour cette région
            const visibleEclipses = eclipsesList.filter(eclipse => {
                return eclipse.keywords.some(keyword => userContext.includes(keyword));
            });

            const embed = new EmbedBuilder()
                .setTitle("🌒 Suivi des Éclipses (Prochaines Décennies)")
                .setColor(0x34495E)
                .setTimestamp();

            const displayList = visibleEclipses.length > 0 ? visibleEclipses : eclipsesList.slice(0, 6);

            if (visibleEclipses.length > 0) {
                embed.setDescription(`Voici les prochaines éclipses majeures visibles depuis **${displayName.split(',')[0]}** (jusqu'en 2045) :`);
            } else {
                embed.setDescription(`Aucune éclipse majeure ciblée n'a de trajectoire directe sur **${displayName.split(',')[0]}** dans notre sélection.\n\n*Voici un aperçu des plus grandes éclipses mondiales à venir :*`);
            }

            // On limite à 10 résultats max pour respecter les limites Discord
            displayList.slice(0, 10).forEach(eclipse => {
                embed.addFields({
                    name: `${eclipse.name} (${eclipse.date})`,
                    value: `✨ **Type** : ${eclipse.type}\n🌍 **Zones visibles** : ${eclipse.visibility}`,
                    inline: false
                });
            });

            embed.setFooter({ text: "Source : Données astronomiques NASA / Catalogues d'éclipses à long terme" });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Erreur Eclipses :", error);
            await interaction.editReply({
                content: `❌ Une erreur est survenue lors du traitement de la localisation : ${error.message}`
            });
        }
    }
};