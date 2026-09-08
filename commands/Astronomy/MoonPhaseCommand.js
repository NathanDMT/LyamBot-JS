const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');

module.exports = {
    category: 'Astronomy',
    // 1. Définition de la commande Slash
    data: new SlashCommandBuilder()
        .setName('moonphase')
        .setDescription("Affiche la phase actuelle de la Lune, les horaires et les prochaines étapes pour une ville")
        .addStringOption(option =>
            option.setName('ville')
                .setDescription("Nom de la ville (ex: Paris)")
                .setRequired(true)
        ),

    // 2. Exécution de la commande
    async execute(interaction, client) {
        await interaction.deferReply();
        const ville = interaction.options.getString('ville');
        const apiKey = process.env.WEATHER_API_KEY;

        try {
            const todayDate = new Date();
            const todayString = todayDate.toISOString().slice(0, 10);
           
            // Appel API WeatherAPI (Astronomy) pour les données locales
            const response = await axios.get('https://api.weatherapi.com/v1/astronomy.json', {
                params: {
                    key: apiKey,
                    q: ville,
                    dt: todayString
                }
            });

            const data = response.data;

            if (data.error) {
                const message = data.error.message || 'Erreur inconnue.';
                await interaction.editReply({
                    content: `❌ Erreur API : ${message}`
                });
                return;
            }

            const astro = data.astronomy.astro;
            const location = data.location.name;

            const originalPhase = astro.moon_phase || 'Inconnue';
            const phase = translatePhase(originalPhase);

            const illumination = astro.moon_illumination ?? '?';
            const moonrise = astro.moonrise || "Non visible";
            const moonset = astro.moonset || "Non visible";
            const emoji = getMoonEmoji(originalPhase);

            // Calculs astronomiques pour les prochaines phases majeures
            const nextFullMoon = getNextFullMoonDate(todayDate);
            const nextNewMoon = getNextNewMoonDate(todayDate);

            // Construction de l'Embed enrichi
            const embed = new EmbedBuilder()
                .setTitle(`🌙 Phase lunaire à ${location}`)
                .setDescription(`${emoji} **Phase actuelle : ${phase}**`)
                .addFields(
                    { name: "💡 Illumination", value: `${illumination}%`, inline: true },
                    { name: "🌄 Lever de Lune", value: moonrise, inline: true },
                    { name: "🌇 Coucher de Lune", value: moonset, inline: true },
                    { name: "🌕 Prochaine Pleine Lune", value: `**${nextFullMoon}**`, inline: false },
                    { name: "🌑 Prochaine Nouvelle Lune", value: `**${nextNewMoon}**`, inline: false }
                )
                // Image illustrative de la Lune (NASA / Wikimedia source publique)
                .setImage('https://upload.wikimedia.org/wikipedia5/commons/e/e1/FullMoon2010.jpg')
                .setColor(0xccccff)
                .setFooter({ text: "Données WeatherAPI & Calculs astronomiques" })
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (e) {
            console.error(e);
            await interaction.editReply({
                content: `❌ Exception levée : ${e.message}`
            });
        }
    }
};

// --- Fonctions utilitaires de calcul et traduction ---

// Traduction des phases de la lune
function translatePhase(phase) {
    switch (phase.toLowerCase()) {
        case 'new moon': return 'Nouvelle lune';
        case 'waxing crescent': return 'Premier croissant';
        case 'first quarter': return 'Premier quartier';
        case 'waxing gibbous': return 'Lune gibbeuse croissante';
        case 'full moon': return 'Pleine lune';
        case 'waning gibbous': return 'Lune gibbeuse décroissante';
        case 'last quarter': return 'Dernier quartier';
        case 'waning crescent': return 'Dernier croissant';
        default: return phase;
    }
}

// Émojis associés
function getMoonEmoji(phase) {
    switch (phase.toLowerCase()) {
        case 'new moon': return '🌑';
        case 'waxing crescent': return '🌒';
        case 'first quarter': return '🌓';
        case 'waxing gibbous': return '🌔';
        case 'full moon': return '🌕';
        case 'waning gibbous': return '🌖';
        case 'last quarter': return '🌗';
        case 'waning crescent': return '🌘';
        default: return '🌙';
    }
}

// Algorithme de calcul de phase basé sur le cycle synodique (29.53 jours)
function getMoonPhaseData(date) {
    const knownNewMoon = new Date(2000, 0, 6, 18, 14);
    const diffDays = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const synodicMonth = 29.53058867;
    const cycle = (diffDays % synodicMonth) / synodicMonth;
    const ageDays = cycle * synodicMonth;

    let phaseName = "Nouvelle lune";
    if (ageDays < 1.84566) phaseName = "Nouvelle lune";
    else if (ageDays < 5.53699) phaseName = "Premier croissant";
    else if (ageDays < 9.22831) phaseName = "Premier quartier";
    else if (ageDays < 12.91964) phaseName = "Lune gibbeuse croissante";
    else if (ageDays < 16.61096) phaseName = "Pleine lune";
    else if (ageDays < 20.30229) phaseName = "Lune gibbeuse décroissante";
    else if (ageDays < 23.99361) phaseName = "Dernier quartier";
    else if (ageDays < 27.68494) phaseName = "Dernier croissant";
    else phaseName = "Nouvelle lune";

    return { name: phaseName };
}

// Trouve la date de la prochaine Pleine Lune
function getNextFullMoonDate(date) {
    let searchDate = new Date(date);
    for (let i = 0; i < 30; i++) {
        searchDate.setDate(searchDate.getDate() + 1);
        const info = getMoonPhaseData(searchDate);
        if (info.name === "Pleine lune") {
            return searchDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
    }
    return "Prochainement";
}

// Trouve la date de la prochaine Nouvelle Lune
function getNextNewMoonDate(date) {
    let searchDate = new Date(date);
    for (let i = 0; i < 30; i++) {
        searchDate.setDate(searchDate.getDate() + 1);
        const info = getMoonPhaseData(searchDate);
        if (info.name === "Nouvelle lune") {
            return searchDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
    }
    return "Prochainement";
}