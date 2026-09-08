const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');

module.exports = {
    category: 'Owner',
    data: new SlashCommandBuilder()
        .setName('xpconfig')
        .setDescription("Affiche ou modifie les paramètres XP du bot pour ce serveur")
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription("Affiche la configuration XP actuelle du serveur")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription("Modifie un paramètre de configuration XP du serveur")
                .addStringOption(option =>
                    option.setName('parameter')
                        .setDescription('Paramètre à modifier')
                        .setRequired(true)
                        .addChoices(
                            { name: 'min_xp (XP minimum par message)', value: 'min_xp' },
                            { name: 'max_xp (XP maximum par message)', value: 'max_xp' },
                            { name: 'cooldown (Délai en secondes)', value: 'cooldown' },
                            { name: 'message_enabled (Annonce de niveau: 1 ou 0)', value: 'message_enabled' }
                        )
                )
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription('La nouvelle valeur à appliquer')
                        .setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const ownerId = process.env.OWNER_ID;
        const guildId = interaction.guildId;

        if (interaction.user.id !== ownerId) {
            const embed = new EmbedBuilder()
                .setTitle("🚫 Accès refusé")
                .setDescription("Tu n'es pas autorisé à utiliser cette commande.")
                .setColor(0xFF5555)
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            const db = await getPDO();

            if (subcommand === 'view') {
                const [rows] = await db.query(
                    "SELECT `key`, `value` FROM xp_settings WHERE server_id = ?",
                    [guildId]
                );

                let content = `**🛠️ Configuration XP actuelle pour ce serveur (${guildId}) :**\n`;
                
                if (!rows || rows.length === 0) {
                    content += "*(Aucune configuration personnalisée sur ce serveur, les valeurs par défaut s'appliquent)*\n\n";
                } else {
                    for (const row of rows) {
                        content += `• \`${row.key}\` = \`${row.value}\`\n`;
                    }
                    content += "\n";
                }

                content += "**📋 Explications des paramètres disponibles :**\n";
                content += "• `min_xp` : XP minimum gagné par message (défaut: 5)\n";
                content += "• `max_xp` : XP maximum gagné par message (défaut: 15)\n";
                content += "• `cooldown` : Temps d'attente en secondes entre chaque gain (défaut: 60)\n";
                content += "• `message_enabled` : Activer l'annonce du niveau supérieur (1 = oui, 0 = non)";

                await interaction.reply({
                    content: content,
                    flags: MessageFlags.Ephemeral
                });

            } else if (subcommand === 'set') {
                const key = interaction.options.getString('parameter');
                const value = interaction.options.getString('value');

                const query = `INSERT OR REPLACE INTO xp_settings (server_id, \`key\`, \`value\`) VALUES (?, ?, ?)`;
                await db.execute(query, [guildId, key, value]);

                await interaction.reply({
                    content: `✅ Le paramètre \`${key}\` a été mis à jour avec la valeur \`${value}\` pour ce serveur !`,
                    flags: MessageFlags.Ephemeral
                });
            }

        } catch (error) {
            await interaction.reply({
                content: `❌ Erreur BDD : ${error.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};