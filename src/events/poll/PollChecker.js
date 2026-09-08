const { EmbedBuilder } = require('discord.js');
const { getPDO } = require('../../../utils/database');

class PollChecker {
    constructor(client) {
        this.client = client;
    }

    start() {
        setInterval(() => {
            this.checkExpiredPolls();
        }, 30000); // Vérifie toutes les 30 secondes
    }

    async checkExpiredPolls() {
        try {
            const db = await getPDO();

            const nowIso = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const [polls] = await db.query(
                "SELECT * FROM polls WHERE fin_at <= ?",
                [nowIso]
            );

            if (!polls || polls.length === 0) return;

            for (const poll of polls) {
                try {
                    const channel = await this.client.channels.fetch(poll.channel_id).catch(() => null);
                    if (!channel) {
                        // 🗑️ Suppression BDD si le salon n'existe plus
                        await db.execute("DELETE FROM polls WHERE id = ?", [poll.id]);
                        continue;
                    }

                    const message = await channel.messages.fetch(poll.message_id).catch(() => null);
                    if (!message) {
                        // 🗑️ Suppression BDD si le message n'existe plus
                        await db.execute("DELETE FROM polls WHERE id = ?", [poll.id]);
                        continue;
                    }

                    // Comptage des votes pour chaque émoji du message
                    const reactionResults = [];
                    for (const [key, reaction] of message.reactions.cache) {
                        const count = Math.max(0, reaction.count - 1); // Retire le vote initial du bot

                        let emojiDisplay = reaction.emoji.name;
                        if (reaction.emoji.id) {
                            emojiDisplay = reaction.emoji.toString();
                        }

                        reactionResults.push({
                            emoji: emojiDisplay,
                            count: count
                        });
                    }

                    const fields = reactionResults.map(r => ({
                        name: `Réaction ${r.emoji}`,
                        value: `**${r.count}** vote(s)`,
                        inline: true
                    }));

                    const closedEmbed = new EmbedBuilder()
                        .setTitle('📊 Sondage Clôturé 🔒')
                        .setDescription(`**${poll.question}**\n\n*Ce sondage est maintenant terminé.*`)
                        .addFields(fields.length > 0 ? fields : [{ name: 'Résultats', value: 'Aucun vote enregistré.', inline: false }])
                        .setColor(0xE74C3C)
                        .setTimestamp();

                    // Modification du message pour afficher l'embed de clôture
                    await message.edit({
                        embeds: [closedEmbed],
                        components: []
                    }).catch(() => {});

                    // 🧹 Suppression de toutes les réactions du message
                    await message.reactions.removeAll().catch((err) => {
                        console.error("Impossible de supprimer les réactions (vérifie les permissions 'Manage Messages') :", err);
                    });

                    // 🗑️ Suppression définitive du sondage de la BDD
                    await db.execute("DELETE FROM polls WHERE id = ?", [poll.id]);

                } catch (err) {
                    console.error(`❌ Erreur traitement sondage ID ${poll.id}:`, err);
                    const dbErrInstance = await getPDO();
                    // 🗑️ En cas d'erreur de traitement, on nettoie aussi l'entrée en BDD
                    await dbErrInstance.execute("DELETE FROM polls WHERE id = ?", [poll.id]);
                }
            }
        } catch (error) {
            console.error("❌ Erreur BDD PollChecker :", error);
        }
    }
}

module.exports = PollChecker;