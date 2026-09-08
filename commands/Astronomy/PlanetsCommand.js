const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const planetMap = {
    'mercure': 'mercury',
    'vénus': 'venus',
    'venus': 'venus',
    'terre': 'earth',
    'mars': 'mars',
    'jupiter': 'jupiter',
    'saturne': 'saturn',
    'uranus': 'uranus',
    'neptune': 'neptune',
};

module.exports = {
    category: 'Astronomy',
    data: new SlashCommandBuilder()
        .setName('planets')
        .setDescription("Affiche les infos d'une planète")
        .addStringOption(option =>
            option.setName('nom')
                .setDescription("Choisis une planète")
                .setRequired(true)
                .addChoices(
                    { name: 'Mercure', value: 'mercure' },
                    { name: 'Vénus', value: 'venus' },
                    { name: 'Terre', value: 'terre' },
                    { name: 'Mars', value: 'mars' },
                    { name: 'Jupiter', value: 'jupiter' },
                    { name: 'Saturne', value: 'saturne' },
                    { name: 'Uranus', value: 'uranus' },
                    { name: 'Neptune', value: 'neptune' }
                )
        ),

    async execute(interaction, client) {
        await interaction.deferReply();

        const nom = interaction.options.getString('nom').toLowerCase();
        const id = planetMap[nom] || nom;
        const apiKey = process.env.SOLAR_SYSTEM_API_KEY;

        if (!apiKey) {
            await interaction.editReply({
                content: "❌ Clé `SOLAR_SYSTEM_API_KEY` manquante dans le fichier `.env`."
            });
            return;
        }

        try {
            const response = await axios.get(`https://api.le-systeme-solaire.net/rest/bodies/${id}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            const data = response.data;

            if (!data || !data.isPlanet) {
                await interaction.editReply({
                    content: "❌ Ce corps céleste n'est pas une planète."
                });
                return;
            }

            const englishName = data.englishName ? data.englishName.charAt(0).toUpperCase() + data.englishName.slice(1) : '';

            const embed = new EmbedBuilder()
                .setTitle(`🪐 Infos sur ${englishName}`)
                .addFields(
                    { name: "⚖️ Masse", value: formatMass(data), inline: true },
                    { name: "☀️ Distance au Soleil", value: data.semimajorAxis ? `${data.semimajorAxis.toLocaleString('fr-FR')} km` : 'Inconnue', inline: true },
                    { name: "🕓 Durée d’un jour", value: data.sideralRotation ? `${data.sideralRotation} h` : 'Inconnue', inline: true },
                    { name: "🌙 Lunes", value: String(data.moons ? data.moons.length : 0), inline: true }
                )
                .setFooter({ text: "Source : api.le-systeme-solaire.net" })
                .setColor(0x1abc9c)
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (e) {
            console.error(e);
            await interaction.editReply({
                content: `❌ Erreur API : \`${e.message}\``
            });
        }
    }
};

function formatMass(data) {
    if (!data.mass || data.mass.massValue === undefined || data.mass.massExponent === undefined) {
        return "Inconnue";
    }
    return `${data.mass.massValue} × 10^${data.mass.massExponent} kg`;
}