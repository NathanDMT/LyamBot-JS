const { SlashCommandBuilder, EmbedBuilder, MessageFlags, version: djsVersion } = require('discord.js');

module.exports = {
    category: 'Utility',
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription("Affiche les informations du bot, y compris le nombre de serveurs où il est présent"),

    async execute(interaction, client) {
        // 1. Calcul du nombre total de serveurs et d'utilisateurs uniques/cumulés
        const totalGuilds = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

        // 2. Calcul du temps de fonctionnement (Uptime)
        const totalSeconds = Math.floor(client.uptime / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const uptimeString = `${days}j ${hours}h ${minutes}m ${seconds}s`;

        // 3. Création de l'Embed de statistiques
        const embed = new EmbedBuilder()
            .setTitle(`📊 Statistiques de ${client.user.username}`)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setColor(0x5865F2)
            .addFields(
                { 
                    name: '🌐 Serveurs', 
                    value: `Présent sur **${totalGuilds}** serveur(s)`, 
                    inline: true 
                },
                { 
                    name: '👥 Utilisateurs', 
                    value: `**${totalUsers.toLocaleString()}** membres au total`, 
                    inline: true 
                },
                { 
                    name: '📡 Latence Bot / API', 
                    value: `⚡ **${Date.now() - interaction.createdTimestamp} ms**\n🌐 **${Math.round(client.ws.ping)} ms**`, 
                    inline: true 
                },
                { 
                    name: '⏱️ Temps de fonctionnement', 
                    value: `\`${uptimeString}\``, 
                    inline: true 
                },
                { 
                    name: '⚙️ Versions', 
                    value: `• **Node.js :** \`${process.version}\`\n• **Discord.js :** \`v${djsVersion}\``, 
                    inline: true 
                }
            )
            .setFooter({ 
                text: `Demandé par ${interaction.user.username}`, 
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
            })
            .setTimestamp();

        // Envoi en mode éphémère (seul l'utilisateur voit le message)
        await interaction.reply({ 
            embeds: [embed],
            flags: MessageFlags.Ephemeral 
        });
    }
};