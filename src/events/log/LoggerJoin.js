const { Events, EmbedBuilder } = require('discord.js');
const { getPDO } = require('../../../utils/database');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        let channelId = null;

        try {
            const db = await getPDO();
            const [rows] = await db.query(
                "SELECT channel_id FROM modlog_config WHERE server_id = ? AND event_type = 'join'",
                [member.guild.id]
            );
            if (rows && rows.length > 0) {
                channelId = rows[0].channel_id;
            }
        } catch (e) {
            console.error("❌ Erreur BDD JoinLogger : " + e.message);
            return;
        }

        if (!channelId) return;

        const guild = member.guild;
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        const user = member.user;
        const avatarUrl = user.displayAvatarURL();

        // Calcul de l'âge du compte à partir du Snowflake[cite: 5]
        const createdAt = user.createdAt;
        const now = new Date();
        const diffMs = now - createdAt;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const ageStr = diffDays > 0 ? `il y a ${diffDays} jour(s)` : "aujourd'hui";

        const memberCount = guild.memberCount;
        const joinedAtStr = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const embed = new EmbedBuilder()
            .setAuthor({ name: user.username, iconURL: avatarUrl })
            .setTitle("Nouveau membre")
            .setDescription(`<@${user.id}> est le **${memberCount}e** membre à rejoindre.\nCompte créé ${ageStr}.`)
            .setFooter({ text: `ID : ${user.id} • Arrivé le ${joinedAtStr}` })
            .setColor(0x00FF00);

        await channel.send({ embeds: [embed] });
    }
};