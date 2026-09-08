const { SlashCommandBuilder, EmbedBuilder, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverstats')
        .setDescription('Affiche les statistiques du serveur'),

    async execute(interaction, client) {
        const guild = interaction.guild;

        // Fetch des membres si nécessaire pour décompter les bots
        const members = await guild.members.fetch();
        const memberCount = guild.memberCount;
        const roleCount = guild.roles.cache.size;

        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        const bots = members.filter(m => m.user.bot).size;

        const createdAt = guild.createdAt;
        const dateStr = createdAt.toLocaleDateString('fr-FR') + ' ' + createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const embed = new EmbedBuilder()
            .setTitle("📊 Statistiques du serveur")
            .setColor(0x5865F2)
            .addFields(
                { name: '👥 Membres totaux', value: String(memberCount), inline: true },
                { name: '🤖 Bots', value: String(bots), inline: true },
                { name: '🙋 Humains', value: String(memberCount - bots), inline: true },
                { name: '📛 Rôles', value: String(roleCount), inline: true },
                { name: '💬 Textuels', value: String(textChannels), inline: true },
                { name: '🔊 Vocaux', value: String(voiceChannels), inline: true },
                { name: '📆 Créé le', value: dateStr, inline: false }
            );

        await interaction.reply({ 
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
};