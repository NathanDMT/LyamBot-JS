const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');

const paginationData = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription("Affiche l'historique des sanctions d’un membre")
        .addUserOption(option =>
            option.setName('user')
                .setDescription("Utilisateur ciblé")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('user');

        try {
            const db = await getPDO();
            const [rows] = await db.query(
                "SELECT * FROM sanctions WHERE user_id = ? ORDER BY date DESC",
                [targetUser.id]
            );

            if (!rows || rows.length === 0) {
                await interaction.reply({ content: "🔍 Aucun historique trouvé pour cet utilisateur.", flags: MessageFlags.Ephemeral });
                return;
            }

            await interaction.deferReply();

            const embed = buildEmbed(rows, targetUser.id, 0);
            const buttons = buildButtons(0, Math.ceil(rows.length / 5));

            const response = await interaction.followUp({ embeds: [embed], components: [buttons] });

            paginationData.set(response.id, {
                userId: targetUser.id,
                history: rows,
                page: 0
            });

        } catch (e) {
            if (interaction.deferred) {
                await interaction.followUp({ content: "Erreur BDD : " + e.message });
            } else {
                await interaction.reply({ content: "Erreur BDD : " + e.message, flags: MessageFlags.Ephemeral });
            }
        }
    },

    async handleButton(interaction, client) {
        const messageId = interaction.message?.id;
        const customId = interaction.customId;

        if (!paginationData.has(messageId)) {
            await interaction.deferUpdate();
            return;
        }

        const data = paginationData.get(messageId);
        const totalPages = Math.ceil(data.history.length / 5);

        if (customId === 'history_next' && data.page < totalPages - 1) {
            data.page++;
        } else if (customId === 'history_prev' && data.page > 0) {
            data.page--;
        } else {
            await interaction.deferUpdate();
            return;
        }

        const embed = buildEmbed(data.history, data.userId, data.page);
        const buttons = buildButtons(data.page, totalPages);

        await interaction.update({ embeds: [embed], components: [buttons] });
    }
};

function buildEmbed(history, userId, page) {
    const perPage = 5;
    const start = page * perPage;
    const slice = history.slice(start, start + perPage);
    const totalPages = Math.ceil(history.length / perPage);

    const embed = new EmbedBuilder()
        .setTitle(`📄 Historique des sanctions de <@${userId}>`)
        .setColor(0xFFA500)
        .setFooter({ text: `Page ${page + 1} / ${totalPages}` });

    slice.forEach(entry => {
        const dateObj = new Date(entry.date);
        const dateStr = dateObj.toLocaleDateString('fr-FR') + ' ' + dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        embed.addFields({
            name: `${String(entry.type).toUpperCase()} - ${dateStr}`,
            value: `👤 Modérateur: <@${entry.moderator_id}>\n✏️ Raison: \`${entry.reason}\``,
            inline: false
        });
    });

    return embed;
}

function buildButtons(page, totalPages) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("history_prev")
            .setLabel("⬅️ Précédent")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
        new ButtonBuilder()
            .setCustomId("history_next")
            .setLabel("Suivant ➡️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1)
    );
}