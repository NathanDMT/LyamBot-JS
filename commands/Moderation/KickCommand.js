const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const ModLogger = require('../../src/events/log/ModLogger');
const LogColors = require('../../src/events/log/LogColors');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulse un membre du serveur')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Membre à expulser')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Raison du kick')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée';

        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            const embed = new EmbedBuilder()
                .setTitle("Accès refusé ❌")
                .setDescription("Tu n’as pas la permission d’expulser des membres.")
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        const guild = interaction.guild;
        const staffId = interaction.user?.id ?? '0';

        try {
            const targetMember = await guild.members.fetch(targetUser.id);
            await targetMember.kick(reason);

            const embed = new EmbedBuilder()
                .setTitle("✅ Membre expulsé")
                .setDescription(`**${targetUser.username}** a été expulsé.\n✏️ Raison : \`${reason}\``)
                .setColor(0x00AAFF);

            await interaction.reply({ embeds: [embed] });

            await ModLogger.logAction(
                client,
                guild.id,
                'Kick',
                targetUser.id,
                staffId,
                `Expulsion de **${targetUser.username}**\n✏️ \`${reason}\``,
                LogColors.get('Kick')
            );

        } catch (e) {
            const embed = new EmbedBuilder()
                .setTitle("Erreur ❌")
                .setDescription(`Impossible d’expulser l’utilisateur ou membre introuvable dans le serveur (\`${targetUser?.id}\`).`)
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};