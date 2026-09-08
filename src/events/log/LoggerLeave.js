const { Events, EmbedBuilder } = require('discord.js');
const { getPDO } = require('../../../utils/database');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {
        let channelId = null;

        try {
            const db = await getPDO();
            const [rows] = await db.query(
                "SELECT channel_id FROM modlog_config WHERE server_id = ? AND event_type = 'leave'",
                [member.guild.id]
            );
            if (rows && rows.length > 0) {
                channelId = rows[0].channel_id;
            }
        } catch (e) {
            console.error("❌ Erreur BDD LeaveLogger : " + e.message);
            return;
        }

        if (!channelId) return;

        const guild = member.guild;
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        const user = member.user;
        const avatarUrl = user.displayAvatarURL();

        // Durée de présence[cite: 6]
        let joinedDuration = 'Date d’arrivée inconnue';
        if (member.joinedAt) {
            const diffMs = new Date() - member.joinedAt;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            joinedDuration = `Présent depuis ${diffDays} jour(s)`;
        }

        // Liste des rôles (exclut @everyone)[cite: 6]
        const roles = member.roles.cache
            .filter(r => r.id !== guild.id)
            .map(r => `<@&${r.id}>`);
        
        const rolesStr = roles.length === 0 ? "*Aucun rôle*" : roles.join(', ');

        const now = new Date();
        const leftAtStr = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const embed = new EmbedBuilder()
            .setAuthor({ name: user.username, iconURL: avatarUrl })
            .setTitle("Départ d’un membre")
            .setDescription(`<@${user.id}> a quitté le serveur.\n${joinedDuration}\n\n**Rôles :** ${rolesStr}`)
            .setFooter({ text: `ID : ${user.id} • Parti le ${leftAtStr}` })
            .setColor(0xFF5555);

        await channel.send({ embeds: [embed] });
    }
};