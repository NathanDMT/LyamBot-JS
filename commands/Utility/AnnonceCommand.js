const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('annonce')
        .setDescription('Créer une annonce')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Contenu de l’annonce')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        try {
            const contenu = interaction.options.getString('message');

            if (!contenu) {
                throw new Error("Le message est vide ou manquant.");
            }

            // Création de l'embed esthétique
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `Annonce de ${interaction.user.displayName}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTitle("📢 Annonce Officielle")
                .setDescription(contenu)
                .setColor(0x5865F2) // Bleu flou (couleur Discord)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true })) // Icône du serveur
                .setFooter({ 
                    text: interaction.guild.name, 
                    iconURL: interaction.guild.iconURL({ dynamic: true }) 
                })
                .setTimestamp();

            // Envoi du message public dans le salon
            await interaction.reply({ embeds: [embed] });

        } catch (e) {
            await interaction.reply({
                content: "❌ Erreur : " + e.message,
                flags: MessageFlags.Ephemeral // Réponse privée uniquement pour l'auteur[cite: 2, 8]
            });
        }
    }
};