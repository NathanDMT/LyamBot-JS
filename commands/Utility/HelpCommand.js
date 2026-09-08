const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags 
} = require('discord.js');

const categoryStyles = {
    'Moderation': ['📛 Modération', 0xFF5555],
    'XP_Moderation': ['🛡️ XP Modération', 0xFF8800],
    'XP': ['📈 Système XP', 0x55FFAA],
    'Game': ['🎮 Mini-jeux', 0xAA55FF],
    'Events': ['📅 Événements', 0xFFAA00],
    'Logs': ['📝 Logs & Historique', 0xAAAAAA],
    'Utility': ['🧰 Utilitaires', 0x55AAFF],
    'Owner': ['👑 Commandes Admin', 0xFFD700],
    'Astronomy': ['🌠 Astronomie', 0x005288],
    'Default': ['📂 Autres', 0xCCCCCC]
};

module.exports = {
    category: 'Utility',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche le menu d’aide interactif des commandes'),

    async execute(interaction, client) {
        const categories = getGroupedCommands(client);
        const categoryKeys = Object.keys(categories);

        // Embed d'accueil par défaut
        const embed = buildMainEmbed(client, categories);
        const components = buildComponents('home', categoryKeys);

        await interaction.reply({
            embeds: [embed],
            components: components,
            flags: MessageFlags.Ephemeral
        });
    },

    // Gestionnaire unique pour les interactions des boutons et menus déroulants
    async handleInteraction(interaction, client) {
        const categories = getGroupedCommands(client);
        const categoryKeys = Object.keys(categories);
        let selectedCat = 'home';

        if (interaction.isStringSelectMenu()) {
            selectedCat = interaction.values[0];
        } else if (interaction.isButton()) {
            const customId = interaction.customId;

            if (customId === 'help_home') {
                selectedCat = 'home';
            } else if (customId.startsWith('help_nav_')) {
                const parts = customId.split(':');
                const action = parts[1];
                const currentCat = parts[2];
                
                const currentIndex = categoryKeys.indexOf(currentCat);
                if (action === 'prev' && currentIndex > 0) {
                    selectedCat = categoryKeys[currentIndex - 1];
                } else if (action === 'next' && currentIndex < categoryKeys.length - 1) {
                    selectedCat = categoryKeys[currentIndex + 1];
                } else {
                    selectedCat = currentCat;
                }
            }
        }

        let embed;
        if (selectedCat === 'home' || !categories[selectedCat]) {
            embed = buildMainEmbed(client, categories);
        } else {
            embed = buildCategoryEmbed(selectedCat, categories[selectedCat]);
        }

        const components = buildComponents(selectedCat, categoryKeys);

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }
};

// --- Fonctions Utilitaires ---

// Groupe toutes les commandes par catégorie
function getGroupedCommands(client) {
    const grouped = {};
    client.commands.forEach((cmd) => {
        const data = cmd.data.toJSON ? cmd.data.toJSON() : cmd.data;
        const category = cmd.category || 'Default';
        const label = `\`/${data.name}\` : ${data.description || 'Pas de description'}`;

        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(label);
    });
    return grouped;
}

// Embed du menu principal (Accueil)
function buildMainEmbed(client, categories) {
    const totalCmds = client.commands.size;
    let desc = `Bienvenue dans le menu d'aide !\nIl y a actuellement **${totalCmds} commande(s)** disponible(s).\n\nUtilise le menu déroulant ci-dessous ou les boutons pour parcourir les catégories.\n\n`;

    for (const [cat, cmds] of Object.entries(categories)) {
        const label = categoryStyles[cat] ? categoryStyles[cat][0] : cat;
        desc += `${label} : **${cmds.length} commande(s)**\n`;
    }

    return new EmbedBuilder()
        .setTitle("📚 Centre d'aide - Accueil")
        .setDescription(desc)
        .setColor(0x5865F2)
        .setTimestamp();
}

// Embed d'une catégorie spécifique
function buildCategoryEmbed(catKey, commands) {
    const style = categoryStyles[catKey] || [catKey, 0x5865F2];
    return new EmbedBuilder()
        .setTitle(`Catégorie - ${style[0]}`)
        .setDescription(commands.join('\n'))
        .setColor(style[1])
        .setFooter({ text: `Total : ${commands.length} commande(s)` })
        .setTimestamp();
}

// Construit le menu déroulant et les boutons
function buildComponents(currentCat, categoryKeys) {
    // 1. Menu déroulant
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_select_category')
        .setPlaceholder('📂 Choisir une catégorie...');

    selectMenu.addOptions({
        label: '🏠 Accueil (Résumé)',
        value: 'home',
        default: currentCat === 'home'
    });

    for (const catKey of categoryKeys) {
        const [label] = categoryStyles[catKey] || [catKey];
        selectMenu.addOptions({
            label: label,
            value: catKey,
            default: currentCat === catKey
        });
    }

    const rowMenu = new ActionRowBuilder().addComponents(selectMenu);

    // 2. Boutons de navigation
    const currentIndex = categoryKeys.indexOf(currentCat);
    const isHome = currentCat === 'home';

    const btnPrev = new ButtonBuilder()
        .setCustomId(`help_nav_:prev:${currentCat}`)
        .setLabel('⬅️ Précédent')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isHome || currentIndex <= 0);

    const btnHome = new ButtonBuilder()
        .setCustomId('help_home')
        .setLabel('🏠 Accueil')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(isHome);

    const btnNext = new ButtonBuilder()
        .setCustomId(`help_nav_:next:${currentCat}`)
        .setLabel('Suivant ➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isHome || currentIndex >= categoryKeys.length - 1);

    const rowButtons = new ActionRowBuilder().addComponents(btnPrev, btnHome, btnNext);

    return [rowMenu, rowButtons];
}