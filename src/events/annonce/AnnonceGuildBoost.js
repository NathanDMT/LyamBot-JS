const { Events } = require('discord.js');
const { getPDO } = require('../../../utils/database');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember, client) {
        // Vérifie si l'utilisateur vient de booster le serveur[cite: 1]
        const wasBoosting = oldMember.premiumSince !== null;
        const isBoosting = newMember.premiumSince !== null;

        if (!wasBoosting && isBoosting) {
            const guildId = newMember.guild.id;
            let channelId = null;

            try {
                const db = await getPDO();
                const [rows] = await db.query(
                    "SELECT channel_id FROM event_config WHERE server_id = ? AND event_type = 'boost' AND enabled = 1",
                    [guildId]
                );
                if (rows && rows.length > 0) {
                    channelId = rows[0].channel_id;
                }
            } catch (e) {
                console.error("❌ Erreur BDD boost : " + e.message);
                return;
            }

            if (!channelId) return;

            const guild = newMember.guild;
            const channel = guild.channels.cache.get(channelId);
            if (!channel) return;

            await channel.send(`🚀 <@${newMember.user.id}> vient de **booster** le serveur ! Merci pour le soutien ! ❤️`);
        }
    }
};