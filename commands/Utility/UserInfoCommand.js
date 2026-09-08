const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const ModLogger = require('../../src/events/log/ModLogger');
const LogColors = require('../../src/events/log/LogColors');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription("Affiche les infos d'un utilisateur")
        .addStringOption(option =>
            option.setName('userid')
                .setDescription("ID ou mention de l'utilisateur à inspecter (facultatif)")
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const rawUserId = interaction.options.getString('userid');
        const guild = interaction.guild;
        const staffUser = interaction.user;
        const staffId = staffUser?.id ?? '0';

        let userId = null;

        if (rawUserId) {
            // Nettoyage de l'ID si l'utilisateur a entré une mention ou des caractères spéciaux
            userId = rawUserId.replace(/[<@!>]/g, '').trim();

            if (!/^\d{17,20}$/.test(userId)) {
                const embed = new EmbedBuilder()
                    .setTitle("Erreur ❌")
                    .setDescription(`L'identifiant ou la mention \`${rawUserId}\` est invalide.`)
                    .setColor(0xFF0000);

                await interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        if (userId) {
            try {
                const fetchedMember = await guild.members.fetch(userId);
                sendUserInfo(interaction, fetchedMember);

                await ModLogger.logAction(
                    client,
                    guild.id,
                    'Consultation utilisateur',
                    fetchedMember.user.id,
                    staffId,
                    `Consultation de <@${fetchedMember.user.id}> via /userinfo`,
                    LogColors.get('Userinfo')
                );
            } catch (e) {
                const embed = new EmbedBuilder()
                    .setTitle("Erreur ❌")
                    .setDescription(`Impossible de trouver l'utilisateur avec l'ID \`${userId}\` sur ce serveur.`)
                    .setColor(0xFF0000);

                await interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }
        } else {
            sendUserInfo(interaction, interaction.member);

            await ModLogger.logAction(
                client,
                guild.id,
                'Consultation utilisateur',
                interaction.member.user.id,
                staffId,
                "Consultation de soi-même via /userinfo",
                LogColors.get('Consultation utilisateur')
            );
        }
    }
};

function sendUserInfo(interaction, member) {
    const user = member.user;

    // Calcul du timestamp Snowflake
    const createdAt = Math.floor(Number(BigInt(user.id) >> 22n) / 1000 + 1420070400);

    const embed = new EmbedBuilder()
        .setTitle("🔎 Informations de l'utilisateur")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setColor(0x5865F2)
        .addFields(
            { name: "👥 Utilisateur", value: `<@${user.id}>`, inline: true },
            { name: "🆔 ID", value: user.id, inline: false },
            { name: "📅 Créé le", value: `<t:${createdAt}:F>`, inline: false },
            { name: "📛 Pseudo sur le serveur", value: member.nickname || 'Aucun', inline: false },
            { name: "🤖 Bot", value: user.bot ? "Oui" : "Non", inline: false }
        );

    // Envoi éphémère (seul l'utilisateur ayant exécuté la commande voit la réponse)
    interaction.reply({ 
        embeds: [embed], 
        flags: MessageFlags.Ephemeral 
    });
}