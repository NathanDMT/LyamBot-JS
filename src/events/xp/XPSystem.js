const { EmbedBuilder } = require('discord.js');
const { getPDO } = require('../../../utils/database');

class XPSystem {
    async handleMessage(message, client) {
        if (message.author.bot || !message.guildId) return;

        const userId = message.author.id;
        const username = message.author.username;
        const guildId = message.guildId;

        try {
            const db = await getPDO();

            // 1. Récupération de la configuration XP spécifique au serveur
            const [settingsRows] = await db.query(
                "SELECT `key`, `value` FROM xp_settings WHERE server_id = ?",
                [guildId]
            );

            const settings = {};
            if (settingsRows && settingsRows.length > 0) {
                for (const row of settingsRows) {
                    settings[row.key] = row.value;
                }
            }

            // Valeurs par défaut si non paramétrées sur le serveur
            const minXP = Number(settings.min_xp ?? 5);
            const maxXP = Number(settings.max_xp ?? 15);
            const cooldown = Number(settings.cooldown ?? 60);
            const messageEnabled = (settings.message_enabled ?? '1') === '1';

            // 2. Récupération de l'activité du membre
            const [rows] = await db.query(
                "SELECT xp, level, last_message_at FROM users_activity WHERE user_id = ? AND guild_id = ?",
                [userId, guildId]
            );

            const user = rows && rows.length > 0 ? rows[0] : null;
            const now = new Date();
            const gainXP = Math.floor(Math.random() * (maxXP - minXP + 1)) + minXP;

            if (user) {
                const lastMessageDate = user.last_message_at 
                    ? new Date(user.last_message_at) 
                    : new Date(now.getTime() - (cooldown + 10) * 1000);
                const diffInSeconds = Math.floor((now.getTime() - lastMessageDate.getTime()) / 1000);

                if (diffInSeconds < cooldown) return;

                const newXP = Number(user.xp) + gainXP;
                const newLevel = this.calculerNiveau(newXP);

                await db.execute(
                    "UPDATE users_activity SET xp = ?, level = ?, username = ?, last_message_at = CURRENT_TIMESTAMP WHERE user_id = ? AND guild_id = ?",
                    [newXP, newLevel, username, userId, guildId]
                );

                if (newLevel > Number(user.level) && messageEnabled) {
                    const embed = new EmbedBuilder()
                        .setTitle("🎉 Niveau supérieur !")
                        .setDescription(`<@${userId}> est maintenant niveau **${newLevel}** sur ce serveur !`)
                        .setColor(0x00FF00)
                        .setTimestamp();

                    await message.channel.send({ embeds: [embed] });
                }
            } else {
                const initialLevel = this.calculerNiveau(gainXP);
                await db.execute(
                    "INSERT INTO users_activity (user_id, guild_id, username, xp, level, last_message_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                    [userId, guildId, username, gainXP, initialLevel]
                );
            }
        } catch (error) {
            console.error("❌ Erreur dans XPSystem :", error);
        }
    }

    calculerNiveau(xp) {
        return Math.floor(Math.sqrt(xp / 100));
    }
}

module.exports = XPSystem;