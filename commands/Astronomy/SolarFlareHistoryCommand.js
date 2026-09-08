const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    category: 'Astronomy',
    data: new SlashCommandBuilder()
        .setName('solarflare-history')
        .setDescription("Affiche l'historique récent des éruptions solaires enregistrées par la NOAA"),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const response = await axios.get('https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json', {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 5000
            });

            if (!response.data || response.data.length === 0) {
                await interaction.editReply({ content: "⚠️ Aucune donnée récente d'éruption solaire disponible." });
                return;
            }

            const flares = response.data.slice(-5).reverse();

            const embed = new EmbedBuilder()
                .setTitle("☀️ Historique Récent des Éruptions Solaires")
                .setDescription("Dernières éruptions solaires majeures détectées par le satellite GOES (NOAA) :")
                .setColor(0xFF8C00)
                .setFooter({ text: "Source : NOAA Space Weather Prediction Center" })
                .setTimestamp();

            flares.forEach((flare, index) => {
                const maxTime = flare.max_time ? flare.max_time.replace('T', ' ').replace('Z', ' UTC') : 'Heure inconnue';
                const beginTime = flare.begin_time ? flare.begin_time.replace('T', ' ').replace('Z', ' UTC') : 'Inconnue';
                const currentClass = flare.max_class || 'Inconnue';

                let intensityEmoji = '🟢';
                if (currentClass.startsWith('M')) intensityEmoji = '🟡';
                if (currentClass.startsWith('X')) intensityEmoji = '🔴 (Majeure)';

                embed.addFields({
                    name: `${intensityEmoji} Éruption Classe **${currentClass}**`,
                    value: `⏱️ **Début** : ${beginTime}\n🔥 **Pic maximal** : ${maxTime}\n📍 **Région active** : ${flare.active_region_num || 'N/A'}`,
                    inline: false
                });
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Erreur SolarFlareHistory :", error);
            await interaction.editReply({
                content: `❌ Impossible de récupérer l'historique des éruptions solaires : ${error.message}`
            });
        }
    }
};