const { Events, EmbedBuilder } = require('discord.js');
const { getPDO } = require('../../../utils/database');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember, client) {
        // Log le boost dès que la propriété premiumSince devient active[cite: 4]
        if (newMember.premiumSince === null || oldMember.premiumSince !== null) return;

        let channelId = null;

        try {
            const db = await getPDO();
            const [rows] = await db.query(
                "SELECT channel_id FROM modlog_config WHERE server_id = ? AND event_type = 'boost'",
                [newMember.guild.id]
            );
            if (rows && rows.length > 0) {
                channelId = rows[0].channel_id;
            }
        } catch (e) {
            console.error("❌ Erreur BDD BoostLogger : " + e.message);
            return;
        }

        if (!channelId) return;

        const guild = newMember.guild;
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        const user = newMember.user;
        const avatarUrl = user.displayAvatarURL();

        const embed = new EmbedBuilder()
            .setAuthor({ name: user.username, iconURL: avatarUrl })
            .setTitle('🚀 Serveur boosté !')
            .setDescription(`**${user.username}** vient de booster le serveur. Merci à lui/elle ! 💜`)
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setColor(0x9b59b6);

        await channel.send({ embeds: [embed] });
    }
};