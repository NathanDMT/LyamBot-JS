const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const MeteorParser = require('../../utils/MeteorParser'); // Vérifie ce chemin d'accès

module.exports = {
    // 1. Définition de la commande Slash (Requis par bot.js)
    data: new SlashCommandBuilder()
        .setName('meteorshowers')
        .setDescription("Affiche les prochaines pluies de météores automatiquement depuis le site AMS"),

    // 2. Méthode d'exécution (Requis par bot.js)
    async execute(interaction, client) {
        const showers = await MeteorParser.getShowers();

        if (!showers || showers.length === 0) {
            await interaction.reply({
                content: "❌ Impossible de récupérer les pluies de météores depuis AMS."
            });
            return;
        }

        const index = getNextShowerIndex(showers);

        if (!showers[index]) {
            await interaction.reply({
                content: "❌ Aucune pluie de météores future détectée."
            });
            return;
        }

        const embed = buildShowerEmbed(showers[index]);
        const buttons = buildNavigationButtons(index, showers.length);

        await interaction.reply({
            embeds: [embed],
            components: [buttons]
        });
    },

    // 3. Gestionnaire des boutons
    async handleButton(interaction, client) {
        const customId = interaction.customId;
        const parts = customId.split(':');
        const action = parts[0];
        let index = parseInt(parts[1], 10);

        const showers = await MeteorParser.getShowers();
        const count = showers.length;

        if (action === 'prev' && index > 0) {
            index--;
        } else if (action === 'next' && index < count - 1) {
            index++;
        }

        const embed = buildShowerEmbed(showers[index]);
        const buttons = buildNavigationButtons(index, count);

        await interaction.update({
            embeds: [embed],
            components: [buttons]
        });
    }
};

// --- Fonctions utilitaires ---

function buildShowerEmbed(shower) {
    const zhr = shower.zhr ?? 'Inconnu';
    const period = shower.period ?? 'Non spécifiée';
    const peak = shower.peak ?? 'Non précisé';
    const visibility = shower.visibility ?? 'Non précisée';
    const name = shower.name ?? 'Inconnue';

    const formattedZhr = !isNaN(zhr) ? `${zhr} météores/h` : zhr;

    return new EmbedBuilder()
        .setTitle(`🌠 Pluie de météores : **${name}**`)
        .setDescription("✨ Voici les informations disponibles pour cette pluie de météores.")
        .addFields(
            { name: "📅 **Période d'activité**", value: period, inline: true },
            { name: "📍 **Pic d'activité**", value: peak, inline: true },
            { name: "💥 **ZHR (taux horaire)**", value: formattedZhr, inline: true },
            { name: "🔭 **Conditions d'observation**", value: visibility, inline: false }
        )
        .setFooter({ text: "Source : amsmeteors.org" })
        .setColor(0x9b59b6);
}

function buildNavigationButtons(index, totalCount) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`prev:${index}`)
            .setLabel('⬅️ Précédent')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(index === 0),
        new ButtonBuilder()
            .setCustomId(`next:${index}`)
            .setLabel('Suivant ➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(index >= totalCount - 1)
    );
}

function getNextShowerIndex(showers) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < showers.length; i++) {
        const peakDate = new Date(showers[i].peak);
        if (!isNaN(peakDate) && peakDate >= today) {
            return i;
        }
    }

    return 0;
}