const { Events } = require('discord.js');
const { getPDO } = require('../../../utils/database');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user, client) {
        if (user.bot) return;

        // 1. Charger les partials si la réaction ou le message n'est pas en cache RAM
        try {
            if (reaction.partial) await reaction.fetch();
            if (reaction.message.partial) await reaction.message.fetch();
        } catch (error) {
            return;
        }

        const message = reaction.message;
        if (!message.guildId) return;

        try {
            const db = await getPDO();

            // 2. Vérification si le message correspond à un sondage actif
            const [rows] = await db.query(
                "SELECT vote_mode FROM polls WHERE message_id = ? AND is_closed = 0",
                [message.id]
            );

            if (!rows || rows.length === 0) return;

            const voteMode = String(rows[0].vote_mode || '').toLowerCase().trim();

            // 3. Traitement du mode UNIQUE
            if (voteMode === 'unique') {
                const currentIdentifier = reaction.emoji.id || reaction.emoji.name;

                // Rechargement forcé de la structure du message depuis l'API Discord
                const fetchedMessage = await message.channel.messages.fetch({ message: message.id, force: true });

                for (const [_, existingReaction] of fetchedMessage.reactions.cache) {
                    const existingIdentifier = existingReaction.emoji.id || existingReaction.emoji.name;

                    // Si c'est un autre émoji que celui cliqué
                    if (existingIdentifier !== currentIdentifier) {
                        try {
                            const users = await existingReaction.users.fetch();

                            if (users.has(user.id)) {
                                // Supprimer la réaction précédente de l'utilisateur
                                await existingReaction.users.remove(user.id);
                            }
                        } catch (removeErr) {
                            // Ignorer les erreurs de permission ou membre introuvable
                        }
                    }
                }
            }
        } catch (e) {
            console.error("❌ Erreur PollReactionHandler :", e.message);
        }
    }
};