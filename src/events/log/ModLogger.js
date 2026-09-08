const { EmbedBuilder } = require('discord.js');
const { getPDO } = require('../../../utils/database');

class ModLogger {
    static async logAction(client, guildId, action, targetId, staffId, reason, color = 0xFF0000) {
        let channelId = null;

        // 🔌 Connexion à la BDD pour récupérer le salon configuré
        try {
            const db = await getPDO();
            const [rows] = await db.query(
                "SELECT channel_id FROM modlog_config WHERE server_id = ?",
                [guildId]
            );

            if (rows && rows.length > 0) {
                channelId = rows[0].channel_id;
            }
        } catch (e) {
            console.error(`❌ Erreur BDD ModLogger : ${e.message}`);
            return;
        }

        // 🔎 Si aucun salon n’est défini
        if (!channelId) {
            console.log(`ℹ️ Aucun salon mod-log défini pour le serveur ${guildId}. Action '${action}' non loggée.`);
            return;
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error(`❌ Serveur ${guildId} introuvable.`);
            return;
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            console.error(`❌ Salon mod-log ${channelId} introuvable dans le serveur ${guildId}.`);
            return;
        }

        // 📝 Création de l’embed
        const embed = new EmbedBuilder()
            .setTitle(`🔔 ${action}`)
            .setColor(color)
            .addFields(
                { name: 'Utilisateur', value: `<@${targetId}>`, inline: false },
                { name: 'Modérateur', value: `<@${staffId}>`, inline: false },
                { name: 'Motif', value: reason, inline: false }
            )
            .setTimestamp();

        // ✅ Envoi du message[cite: 3]
        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`❌ Impossible d'envoyer le log dans le salon ${channelId}:`, error.message);
        }
    }
}

module.exports = ModLogger;