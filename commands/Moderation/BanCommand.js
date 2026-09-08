const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');
const ModLogger = require('../../src/events/log/ModLogger');
const LogColors = require('../../src/events/log/LogColors');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bannir un utilisateur même s’il n’est pas dans le serveur')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('ID de l’utilisateur à bannir')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('raison')
                .setDescription('Raison du bannissement')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';

        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            const embed = new EmbedBuilder()
                .setTitle("Accès refusé 🔒")
                .setDescription("Tu n’as pas la permission de bannir des membres.")
                .setColor(0xFF8800);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        const guild = interaction.guild;
        const staffUser = interaction.user;
        const staffId = staffUser?.id ?? '0';

        try {
            await guild.members.ban(userId, { reason: reason, deleteMessageSeconds: 0 });

            try {
                const db = await getPDO();
                await db.execute(
                    "INSERT INTO sanctions (user_id, type, reason, date, moderator_id, server_id) VALUES (?, 'ban', ?, NOW(), ?, ?)",
                    [userId, reason, staffId, guild.id]
                );
            } catch (dbErr) {
                console.error("Erreur BDD : " + dbErr.message);
            }

            const embed = new EmbedBuilder()
                .setTitle("✅ Utilisateur banni")
                .setDescription(`L'utilisateur <@${userId}> a été banni.\n✏️ Raison : \`${reason}\``)
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed] });

            await ModLogger.logAction(
                client,
                guild.id,
                'Ban',
                userId,
                staffId,
                `Bannissement de <@${userId}>\n✏️ \`${reason}\``,
                LogColors.get('Ban')
            );

        } catch (e) {
            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription(`Impossible de bannir <@${userId}>.\nRaison : ${e.message}`)
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};