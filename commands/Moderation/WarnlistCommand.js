const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');
const ModLogger = require('../../src/events/log/ModLogger');
const LogColors = require('../../src/events/log/LogColors');

const paginationData = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnlist')
        .setDescription('Affiche la liste des avertissements d’un utilisateur')
        .addUserOption(option =>
            option.setName('user')
                .setDescription("Utilisateur ciblé")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            await interaction.reply({ content: "❌ Tu n’as pas la permission d’utiliser cette commande.", flags: MessageFlags.Ephemeral });
            return;
        }

        const targetUser = interaction.options.getUser('user');
        const guildId = interaction.guildId;

        try {
            const db = await getPDO();
            const [warns] = await db.query(
                "SELECT reason, warned_by, created_at FROM warnings WHERE user_id = ? AND server_id = ? ORDER BY created_at DESC",
                [targetUser.id, guildId]
            );

            if (!warns || warns.length === 0) {
                await interaction.reply({ content: `ℹ️ Aucun avertissement trouvé pour <@${targetUser.id}>.`, flags: MessageFlags.Ephemeral });
                return;
            }

            const embed = buildEmbed(warns, targetUser.id, 0);
            const components = buildButtons(0, Math.ceil(warns.length / 5));

            const response = await interaction.reply({ embeds: [embed], components: [components], fetchReply: true });

            paginationData.set(response.id, {
                warns: warns,
                userId: targetUser.id,
                page: 0
            });

            await ModLogger.logAction(
                client,
                guildId,
                'Consultation des warns',
                targetUser.id,
                interaction.user.id,
                'Consultation via /warnlist',
                LogColors.get('Warnlist')
            );

        } catch (e) {
            await interaction.reply({ content: "Erreur BDD : " + e.message, flags: MessageFlags.Ephemeral });
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
        const totalPages = Math.ceil(data.warns.length / 5);

        if (customId === 'warnlist_next' && data.page < totalPages - 1) {
            data.page++;
        } else if (customId === 'warnlist_prev' && data.page > 0) {
            data.page--;
        } else {
            await interaction.deferUpdate();
            return;
        }

        const embed = buildEmbed(data.warns, data.userId, data.page);
        const components = buildButtons(data.page, totalPages);

        await interaction.update({ embeds: [embed], components: [components] });
    }
};

function buildEmbed(warns, userId, page) {
    const perPage = 5;
    const totalPages = Math.ceil(warns.length / perPage);
    const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setFooter({ text: `Page ${page + 1} / ${totalPages}` })
        .addFields({ name: "📋 Avertissements de", value: `<@${userId}>`, inline: false });

    const start = page * perPage;
    const slice = warns.slice(start, start + perPage);

    slice.forEach((warn, i) => {
        const index = start + i + 1;
        const dateObj = new Date(warn.created_at);
        const dateStr = dateObj.toLocaleDateString('fr-FR') + ' ' + dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        embed.addFields({
            name: `• Warn #${index}`,
            value: `Date : \`${dateStr}\`\nRaison : ${warn.reason}\nPar : <@${warn.warned_by}>`
        });
    });

    return embed;
}

function buildButtons(page, totalPages) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("warnlist_prev")
            .setLabel("⬅️ Précédent")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
        new ButtonBuilder()
            .setCustomId("warnlist_next")
            .setLabel("Suivant ➡️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1)
    );
}