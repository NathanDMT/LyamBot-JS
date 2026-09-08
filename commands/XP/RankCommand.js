const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');

module.exports = {
    category: 'XP',
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription("Affiche l'XP, le niveau et les statistiques d'un utilisateur sur le serveur")
        .addUserOption(option =>
            option.setName('user')
                .setDescription("L'utilisateur dont tu veux voir l'XP (laisse vide pour voir le tien)")
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guildId = interaction.guildId;

        await interaction.deferReply();

        try {
            const db = await getPDO();

            // 1. Récupérer les données XP de l'utilisateur ciblé sur ce serveur
            const [rows] = await db.query(
                "SELECT xp, level, username, last_message_at FROM users_activity WHERE user_id = ? AND guild_id = ?",
                [targetUser.id, guildId]
            );

            const userData = rows && rows.length > 0 ? rows[0] : null;

            const xp = userData ? Number(userData.xp) : 0;
            const level = userData ? Number(userData.level) : 0;

            // 2. Calculer le classement (position du joueur sur le serveur)
            const [rankRows] = await db.query(
                "SELECT COUNT(*) as rank FROM users_activity WHERE guild_id = ? AND xp > ?",
                [guildId, xp]
            );
            const rank = (rankRows && rankRows[0] ? rankRows[0].rank : 0) + 1;

            // 3. Calcul de l'XP pour le niveau suivant (Formule inverse : xp = level^2 * 100)
            // Comme le niveau est floor(sqrt(xp / 100)), pour atteindre le niveau suivant (level + 1) :
            const nextLevelXP = Math.pow(level + 1, 2) * 100;
            const currentLevelXP = Math.pow(level, 2) * 100;
            
            // Progression dans le niveau actuel
            const xpInCurrentLevel = xp - currentLevelXP;
            const xpNeededForNext = nextLevelXP - currentLevelXP;
            
            const progressPercent = xpNeededForNext > 0 
                ? Math.min(Math.max((xpInCurrentLevel / xpNeededForNext) * 100, 0), 100).toFixed(1) 
                : 100;

            // Barre de progression visuelle (10 blocs)
            const filledBlocks = Math.round((progressPercent / 100) * 10);
            const emptyBlocks = 10 - filledBlocks;
            const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

            // 4. Création de l'Embed stylisé
            const embed = new EmbedBuilder()
                .setTitle(`📊 Statistiques XP de ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setColor(0x55FFAA)
                .addFields(
                    { name: "🏆 Classement", value: `#${rank} sur le serveur`, inline: true },
                    { name: "⭐ Niveau", value: `Niveau **${level}**`, inline: true },
                    { name: "✨ XP Total", value: `**${xp.toLocaleString()}** XP`, inline: true },
                    { 
                        name: `📈 Progression (Niveau ${level} ➔ ${level + 1})`, 
                        value: `\`[${progressBar}]\` **${progressPercent}%**\n*(~${xpInCurrentLevel.toLocaleString()} / ${xpNeededForNext.toLocaleString()} XP)*`, 
                        inline: false 
                    }
                )
                .setFooter({ 
                    text: `Demandé par ${interaction.user.username} • Serveur : ${interaction.guild.name}`, 
                    iconURL: interaction.guild.iconURL({ dynamic: true }) 
                })
                .setTimestamp();

            if (!userData) {
                embed.setDescription("⚠️ Cet utilisateur n'a pas encore gagné d'XP sur ce serveur (aucun message enregistré).");
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Erreur dans /rank :", error);
            await interaction.editReply({
                content: `❌ Une erreur est survenue lors de la récupération des données d'XP : ${error.message}`
            });
        }
    }
};