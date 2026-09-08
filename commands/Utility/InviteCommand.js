const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription("Envoie le lien pour inviter le bot sur un serveur"),

    async execute(interaction, client) {
        const clientId = process.env.DISCORD_CLIENT_ID || client.user?.id;

        if (!clientId) {
            await interaction.reply({
                content: "❌ Erreur : `DISCORD_CLIENT_ID` non défini dans le fichier `.env`.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=8`;

        const embed = new EmbedBuilder()
            .setTitle("🤖 Invite le bot sur ton serveur !")
            .setDescription(`[Clique ici pour l'ajouter](${inviteUrl})`)
            .setColor(0x5865F2)
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
};