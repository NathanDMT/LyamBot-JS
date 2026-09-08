const { Events } = require('discord.js');
const { getPDO } = require('../../../utils/database');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        const guildId = member.guild.id;
        let channelId = null;

        try {
            const db = await getPDO();
            const [rows] = await db.query(
                "SELECT channel_id FROM event_config WHERE server_id = ? AND event_type = 'join' AND enabled = 1",
                [guildId]
            );
            if (rows && rows.length > 0) {
                channelId = rows[0].channel_id;
            }
        } catch (e) {
            console.error("❌ Erreur BDD welcome : " + e.message);
            return;
        }

        if (!channelId) return;

        const guild = member.guild;
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        await channel.send(`🎉 Bienvenue <@${member.user.id}> sur **${guild.name}** !`);
    }
};