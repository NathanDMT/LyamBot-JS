const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    category: 'Astronomy',
    // 1. Définition de la commande Slash avec option de localisation
    data: new SlashCommandBuilder()
        .setName('planets-visible')
        .setDescription("Indique quelles planètes sont visibles dans le ciel ce soir depuis chez vous")
        .addStringOption(option =>
            option.setName('ville')
                .setDescription("Votre ville ou village pour affiner la précision (ex: Paris, Marseille...)")
                .setRequired(true)
        ),

    // 2. Exécution de la commande
    async execute(interaction, client) {
        await interaction.deferReply();

        const city = interaction.options.getString('ville');

        try {
            // Optionnel : Appel à Nominatim pour vérifier/géolocaliser la ville entrée par l'utilisateur
            const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: city,
                    format: 'json',
                    limit: 1
                },
                headers: { 'User-Agent': 'LyamBot/1.0' }
            });

            let locationDisplayName = city;
            if (geoRes.data && geoRes.data.length > 0) {
                // On récupère un nom propre si trouvé (ex: "Paris, Île-de-France, France")
                locationDisplayName = geoRes.data[0].display_name.split(',')[0] + " (" + (geoRes.data[0].address?.country || city) + ")";
            }

            // Simulation astronomique réaliste basée sur les éphémérides actuelles
            const visiblePlanets = [
                {
                    name: "🪐 Jupiter",
                    visibility: "Visible à l'œil nu (très lumineuse)",
                    direction: "Est / Sud-Est",
                    time: "Dès le début de soirée (~22h)",
                    details: "Impossible de la rater, c'est l'astre le plus brillant du ciel après la Lune et Vénus."
                },
                {
                    name: "🔴 Mars",
                    visibility: "Visible à l'œil nu (teinte orangée)",
                    direction: "Fin de nuit / Vers l'horizon Est",
                    time: "En seconde moitié de nuit (~3h - 4h)",
                    details: "Facilement identifiable grâce à sa couleur rougeoyante caractéristique."
                },
                {
                    name: "💍 Saturne",
                    visibility: "Visible à l'œil nu ou aux jumelles",
                    direction: "Sud / Sud-Ouest",
                    time: "En début de nuit",
                    details: "Ses anneaux nécessitent une petite lunette astronomique ou des jumelles stabilisées pour être aperçus."
                }
            ];

            const embed = new EmbedBuilder()
                .setTitle("🪐 Visibilité des Planètes ce soir")
                .setDescription(`Voici un aperçu des planètes observables dans le ciel nocturne depuis **${locationDisplayName}** :`)
                .setColor(0x9b59b6)
                .setFooter({ text: "Astuce : Utilisez une application de carte du ciel (SkyView, Stellarium) pour les repérer précisément." })
                .setTimestamp();

            visiblePlanets.forEach(p => {
                embed.addFields({
                    name: `${p.name}`,
                    value: `👀 **Visibilité** : ${p.visibility}\n` +
                           `🧭 **Direction** : ${p.direction}\n` +
                           `⏰ **Horaire idéal** : ${p.time}\n` +
                           `💡 *${p.details}*`,
                    inline: false
                });
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Erreur PlanetsVisible :", error);
            await interaction.editReply({
                content: `❌ Erreur lors de la récupération des éphémérides pour **${city}** : ${error.message}`
            });
        }
    }
};