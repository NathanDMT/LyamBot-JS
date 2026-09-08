const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');
const ModLogger = require('../../src/events/log/ModLogger');
const LogColors = require('../../src/events/log/LogColors');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Retire le mute (timeout) d’un membre')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur à unmute')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('user');

        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            const embed = new EmbedBuilder()
                .setTitle("Accès refusé 🔒")
                .setDescription("Permission `MODERATE_MEMBERS` requise.")
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        const guild = interaction.guild;
        const staffId = interaction.user?.id ?? '0';

        try {
            const member = await guild.members.fetch(targetUser.id);
            await member.timeout(null);

            try {
                const db = await getPDO();
                await db.execute(
                    "INSERT INTO sanctions (user_id, type, reason, date, moderator_id, server_id) VALUES (?, 'unmute', ?, NOW(), ?, ?)",
                    [targetUser.id, 'Unmute manuel', staffId, guild.id]
                );
            } catch (dbErr) {
                console.error("Erreur BDD : " + dbErr.message);
            }

            const embed = new EmbedBuilder()
                .setTitle("🔊 Membre unmute")
                .setDescription(`**${targetUser.username}** n’est plus muté.`)
                .setColor(0x33CC33);

            await interaction.reply({ embeds: [embed] });

            await ModLogger.logAction(
                client,
                guild.id,
                'Unmute',
                targetUser.id,
                staffId,
                'Unmute manuel',
                LogColors.get('Unmute')
            );

        } catch (e) {
            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription(`Utilisateur \`${targetUser?.id}\` introuvable.`)
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};