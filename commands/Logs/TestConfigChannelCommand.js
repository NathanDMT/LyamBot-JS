const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database'); // Se trouve dans utils/ à la racine
const ModLogger = require('../../src/events/log/ModLogger');   // Se trouve dans src/events/
const LogColors = require('../../src/events/log/LogColors');   // Se trouve dans src/events/

module.exports = {
    // 1. Définition de la commande Slash (register)
    data: new SlashCommandBuilder()
        .setName('testchannel')
        .setDescription('Teste les salons de modlogs et d’annonce configurés'),

    // 2. Traitement de la commande (handle/execute)
    async execute(interaction, client) {
        const user = interaction.user;
        const staffId = user?.id ?? '0';
        const guildId = interaction.guildId;

        // Envoi d’un log test dans le salon mod-log
        await ModLogger.logAction(
            client,
            guildId,
            'Test Mod-Log',
            user.id,
            staffId,
            'Commande /testmodlog exécutée',
            LogColors.get('Test')
        );

        let announcementList = '';
        let modlogList = '';

        try {
            const db = await getPDO();

            // Salons d'annonce actifs
            const [rows] = await db.query(
                "SELECT event_type, channel_id FROM event_config WHERE server_id = ? AND enabled = 1",
                [guildId]
            );

            if (rows && rows.length > 0) {
                for (const row of rows) {
                    announcementList += `• \`${row.event_type}\` → <#${row.channel_id}>\n`;
                }
            } else {
                announcementList = "Aucun salon d'annonce configuré.";
            }

            // Salons de logs mod
            const [rows2] = await db.query(
                "SELECT event_type, channel_id FROM modlog_config WHERE server_id = ?",
                [guildId]
            );

            if (rows2 && rows2.length > 0) {
                for (const row of rows2) {
                    modlogList += `• \`${row.event_type}\` → <#${row.channel_id}>\n`;
                }
            } else {
                modlogList = "Aucun salon de log mod configuré.";
            }

        } catch (e) {
            announcementList = "❌ Erreur BDD : " + e.message;
            modlogList = "❌ Erreur BDD : " + e.message;
        }

        const embed = new EmbedBuilder()
            .setTitle("✅ Test exécuté avec succès")
            .setDescription("Un message test a été envoyé dans le salon de logs si configuré.")
            .addFields(
                { name: '📣 Salons d’annonces actifs', value: announcementList, inline: false },
                { name: '🛡️ Salons de logs mod', value: modlogList, inline: false }
            )
            .setColor(0x00FF00);

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
};