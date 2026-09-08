const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');
const ModLogger = require('../../src/events/log/ModLogger');
const LogColors = require('../../src/events/log/LogColors');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute un membre pour une durée donnée')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur à mute')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Durée en minutes (1 à 40320)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Raison du mute')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('user');
        const durationMinutes = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'Aucune raison fournie';

        if (durationMinutes <= 0 || durationMinutes > 40320) {
            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription("La durée doit être comprise entre 1 et 40320 minutes (28 jours).")
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            const embed = new EmbedBuilder()
                .setTitle("Accès refusé")
                .setDescription("Permission `MODERATE_MEMBERS` manquante.")
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        const guild = interaction.guild;
        const staffId = interaction.user?.id ?? '0';

        try {
            const member = await guild.members.fetch(targetUser.id);
            const timeoutMs = durationMinutes * 60 * 1000;

            await member.timeout(timeoutMs, reason);

            try {
                const db = await getPDO();
                await db.execute(
                    "INSERT INTO sanctions (user_id, type, reason, date, moderator_id, server_id) VALUES (?, 'mute', ?, NOW(), ?, ?)",
                    [targetUser.id, reason, staffId, guild.id]
                );
            } catch (dbErr) {
                console.error("Erreur BDD : " + dbErr.message);
            }

            const embed = new EmbedBuilder()
                .setTitle("🔇 Membre muté")
                .setDescription(`**${targetUser.username}** a été muté pour \`${durationMinutes}\` minute(s).\n✏️ Raison : \`${reason}\``)
                .setColor(0x9999FF);

            await interaction.reply({ embeds: [embed] });

            await ModLogger.logAction(
                client,
                guild.id,
                'Mute',
                targetUser.id,
                staffId,
                reason,
                LogColors.get('Mute')
            );

        } catch (e) {
            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription(`Impossible de muter l'utilisateur. Erreur : ${e.message}`)
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};