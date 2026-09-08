const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');
const ModLogger = require('../../src/events/log/ModLogger');
const LogColors = require('../../src/events/log/LogColors');

module.exports = {
    // 1. Définition de la commande Slash
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription("Affiche la liste des avertissements d'un utilisateur et permet de les retirer")
        .addStringOption(option =>
            option.setName('user')
                .setDescription("Mention ou ID de l'utilisateur ciblé")
                .setRequired(true)
        ),

    // 2. Traitement de la commande
    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            const embed = new EmbedBuilder()
                .setTitle("Accès refusé 🔒")
                .setDescription("Tu n’as pas la permission de retirer des warns.")
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        const userInput = interaction.options.getString('user').trim();
        const targetUserId = userInput.replace(/[<@!>]/g, '');

        if (!/^\d{17,20}$/.test(targetUserId)) {
            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription("L'identifiant ou la mention de l'utilisateur est invalide.")
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        const guildId = interaction.guildId;

        try {
            const db = await getPDO();

            // Récupérer les warns de l'utilisateur pour ce serveur
            const [warnings] = await db.query(
                "SELECT id, reason, created_at, warned_by FROM warnings WHERE user_id = ? AND server_id = ? ORDER BY created_at DESC",
                [targetUserId, guildId]
            );

            if (!warnings || warnings.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle("Aucun avertissement 📭")
                    .setDescription(`L'utilisateur <@${targetUserId}> n'a aucun avertissement actif sur ce serveur.`)
                    .setColor(0x555555);

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                return;
            }

            // Récupérer les infos de l'utilisateur pour afficher son tag/pseudo proprement
            let targetUserTag = `<@${targetUserId}>`;
            try {
                const fetchedUser = await client.users.fetch(targetUserId);
                if (fetchedUser) {
                    targetUserTag = `**${fetchedUser.tag}**`;
                }
            } catch (err) {
                // Ignore si l'utilisateur n'est pas fetchable et garde la mention
            }

            // Construction de l'embed listant les warns
            const embed = new EmbedBuilder()
                .setTitle(`📋 Avertissements de ${targetUserTag}`)
                .setDescription("Sélectionne le warn que tu souhaites supprimer en cliquant sur le bouton correspondant ci-dessous :")
                .setColor(0xFFA500)
                .setTimestamp();

            const row = new ActionRowBuilder();
            let count = 0;

            warnings.forEach((warn, index) => {
                if (count >= 5) return; // Discord limite à 5 boutons par ligne
                count++;

                const displayNum = index + 1; // Numérotation propre de 1 en 1
                const dateStr = new Date(warn.created_at).toLocaleDateString('fr-FR');
                
                embed.addFields({
                    name: `⚠️ Warn #${displayNum} (Date : ${dateStr})`,
                    value: `✏️ **Raison :** ${warn.reason}\n🛡️ **Modérateur :** <@${warn.warned_by}>`,
                    inline: false
                });

                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`unwarn_delete_${warn.id}_${targetUserId}`)
                        .setLabel(`Supprimer #${displayNum}`)
                        .setStyle(ButtonStyle.Danger)
                );
            });

            const components = row.components.length > 0 ? [row] : [];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: MessageFlags.Ephemeral
            });

        } catch (e) {
            console.error("Erreur /unwarn :", e);
            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription(`Impossible de récupérer les avertissements : ${e.message}`)
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    },

    // 3. Gestionnaire des boutons de suppression
    async handleButton(interaction, client) {
        const customId = interaction.customId;
        if (!customId.startsWith('unwarn_delete_')) return;

        const parts = customId.split('_');
        const warnId = parts[2];
        const targetUserId = parts[3];
        const guildId = interaction.guildId;
        const staffId = interaction.user.id;

        try {
            const db = await getPDO();

            const [warnCheck] = await db.query(
                "SELECT reason FROM warnings WHERE id = ? AND server_id = ?",
                [warnId, guildId]
            );

            if (!warnCheck || warnCheck.length === 0) {
                await interaction.update({
                    content: "❌ Cet avertissement a déjà été supprimé ou n'existe plus.",
                    embeds: [],
                    components: []
                });
                return;
            }

            const warnReason = warnCheck[0].reason;

            // Suppression du warn de la base de données
            await db.execute(
                "DELETE FROM warnings WHERE id = ? AND server_id = ?",
                [warnId, guildId]
            );

            // Enregistrement dans les sanctions sans motif personnalisé de retrait
            try {
                await db.execute(
                    "INSERT INTO sanctions (user_id, type, reason, date, moderator_id, server_id) VALUES (?, 'unwarn', ?, NOW(), ?, ?)",
                    [targetUserId, `Retrait du warn #${warnId} (Raison init: ${warnReason})`, staffId, guildId]
                );
            } catch (dbErr) {
                console.error("Erreur BDD Sanctions : " + dbErr.message);
            }

            // Logger l'action de modération
            await ModLogger.logAction(
                client,
                guildId,
                'Unwarn',
                targetUserId,
                staffId,
                `Suppression de l'avertissement #${warnId}`,
                LogColors.get('Unwarn') || 0x00FF00
            );

            const successEmbed = new EmbedBuilder()
                .setTitle("✅ Avertissement retiré")
                .setDescription(`L'avertissement de l'utilisateur <@${targetUserId}> a été supprimé avec succès.`)
                .setColor(0x00FF00);

            await interaction.update({
                embeds: [successEmbed],
                components: []
            });

        } catch (e) {
            console.error("Erreur clic bouton unwarn :", e);
            await interaction.reply({
                content: `❌ Une erreur est survenue lors de la suppression : ${e.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};