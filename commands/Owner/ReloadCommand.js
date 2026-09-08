const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Recharge une commande slash dans Discord (code non mis à jour sans redémarrage)')
        .addStringOption(option =>
            option.setName('commande')
                .setDescription("Nom de la commande à recharger (ex: warnlist)")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const ownerId = process.env.OWNER_ID;

        if (interaction.user.id !== ownerId) {
            await interaction.reply({
                content: "❌ Tu n'as pas la permission d’utiliser cette commande.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const commandInput = interaction.options.getString('commande').toLowerCase();
        
        // Recherche du fichier de commande dans la Collection du client
        const command = client.commands.get(commandInput);
        
        if (!command) {
            await interaction.reply({
                content: "❌ Commande introuvable dans le bot.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Pour recharger un module en Node.js, on supprime le fichier du cache require
        try {
            // Retrouve le nom de la classe/fichier (ex: WarnlistCommand.js)
            const commandNameFormatted = commandInput.charAt(0).toUpperCase() + commandInput.slice(1) + 'Command.js';
            
            // Recherche récursive du chemin du fichier
            const findFilePath = (dir) => {
                const files = fs.readdirSync(dir, { withFileTypes: true });
                for (const file of files) {
                    const fullPath = path.join(dir, file.name);
                    if (file.isDirectory()) {
                        const res = findFilePath(fullPath);
                        if (res) return res;
                    } else if (file.name.toLowerCase() === commandNameFormatted.toLowerCase()) {
                        return fullPath;
                    }
                }
                return null;
            };

            const filePath = findFilePath(path.join(__dirname, '..'));

            if (filePath && fs.existsSync(filePath)) {
                delete require.cache[require.resolve(filePath)];
                const newCommand = require(filePath);
                client.commands.set(newCommand.data.name, newCommand);

                await interaction.reply({
                    content: `✅ Commande \`/${commandInput}\` rechargée en mémoire.\n🔁 Redémarre le bot pour réenregistrer les options côté API si tu as modifié la structure.`,
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    content: "❌ Fichier de commande introuvable sur le disque.",
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (error) {
            await interaction.reply({
                content: `❌ Erreur : ${error.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};