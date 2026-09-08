const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');
const ModLogger = require('../../src/events/log/ModLogger');
const LogColors = require('../../src/events/log/LogColors');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Permet de mettre un avertissement à un utilisateur')
        .addUserOption(option =>
            option.setName('userid')
                .setDescription("L'utilisateur à avertir")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('raison')
                .setDescription("Raison de l'avertissement")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('userid');
        const reason = interaction.options.getString('raison');

        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            const embed = new EmbedBuilder()
                .setTitle("Accès refusé 🔒")
                .setDescription("Tu n’as pas la permission de warn les membres.")
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        const guild = interaction.guild;
        const staffId = interaction.user?.id ?? '0';

        try {
            const db = await getPDO();

            await db.execute(
                "INSERT INTO warnings (user_id, warned_by, reason, server_id) VALUES (?, ?, ?, ?)",
                [targetUser.id, staffId, reason, guild.id]
            );

            await ModLogger.logAction(
                client,
                guild.id,
                'Avertissement',
                targetUser.id,
                staffId,
                reason,
                LogColors.get('Warn')
            );

            const [countRows] = await db.query(
                "SELECT COUNT(*) as total FROM warnings WHERE user_id = ? AND server_id = ?",
                [targetUser.id, guild.id]
            );
            const totalWarns = countRows[0]?.total ?? 1;

            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle("⚠️ Tu as reçu un avertissement")
                    .setDescription(`Serveur : **${guild.name}**\nRaison : \`${reason}\`\nTu as désormais **${totalWarns}** avertissement(s).`)
                    .setColor(0xFFA500);

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmErr) {
                // Ignore si les MP de l'utilisateur sont fermés
            }

            const embed = new EmbedBuilder()
                .setTitle("⚠️ Avertissement donné")
                .setDescription(`L'utilisateur <@${targetUser.id}> a été averti.\n✏️ Raison : \`${reason}\``)
                .setColor(0xFFA500);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

        } catch (e) {
            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription(`Impossible d'enregistrer l'avertissement : ${e.message}`)
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};