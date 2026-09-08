const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const ModLogger = require('../../src/events/log/ModLogger');
const LogColors = require('../../src/events/log/LogColors');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Débannir un utilisateur via son ID')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription("ID de l’utilisateur à débannir")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const userId = interaction.options.getString('userid');

        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            const embed = new EmbedBuilder()
                .setTitle("Accès refusé 🔒")
                .setDescription("Tu n’as pas la permission de débannir des membres.")
                .setColor(0xFF8800);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        const guild = interaction.guild;
        const staffId = interaction.user?.id ?? '0';

        try {
            const banInfo = await guild.bans.fetch(userId);
            const username = banInfo.user.username;

            await guild.bans.remove(userId);

            const embed = new EmbedBuilder()
                .setTitle("✅ Utilisateur débanni")
                .setDescription(`**${username}** a été débanni.`)
                .setColor(0x00FF00);

            await interaction.reply({ embeds: [embed] });

            await ModLogger.logAction(
                client,
                guild.id,
                'Unban',
                userId,
                staffId,
                `Débannissement de **${username}** via /unban`,
                LogColors.get('Unban')
            );

        } catch (e) {
            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription(`Aucun utilisateur banni avec l’ID \`${userId}\` ou permissions insuffisantes.`)
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};