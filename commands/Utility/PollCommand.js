const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getPDO } = require('../../utils/database');

module.exports = {
    category: 'Utility',
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Crée un sondage avec une durée de fin, un mode de vote et des réactions personnalisées')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('La question du sondage')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Durée du sondage (en minutes)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Type de vote')
                .setRequired(true)
                .addChoices(
                    { name: 'Unique (un seul choix par personne)', value: 'unique' },
                    { name: 'Multiple (plusieurs choix possibles)', value: 'multiple' }
                )
        )
        .addStringOption(option =>
            option.setName('reactions')
                .setDescription('Les émojis séparés par des espaces (ex: 👍 👎 ou 🔴 🔵 🟢)')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const question = interaction.options.getString('question');
        const duration = interaction.options.getInteger('duration');
        const mode = interaction.options.getString('mode');
        const reactionsInput = interaction.options.getString('reactions');

        if (!question || !duration || !mode || !reactionsInput) {
            await interaction.reply({
                content: "❌ Les options sont manquantes ou invalides.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Nettoyage et découpage des émojis saisis (par espace ou par virgule)
        const reactions = reactionsInput.trim().split(/[\s,]+/);

        if (reactions.length < 2 || reactions.length > 10) {
            await interaction.reply({
                content: "❌ Tu dois fournir entre **2 et 10 réactions** valides pour ton sondage.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('📊 Sondage :')
            .setDescription(`**${question}**\n\n*Réagis avec les émojis ci-dessous pour voter !*`)
            .addFields(
                { name: 'Durée', value: `${duration} minute(s)`, inline: true },
                { name: 'Mode', value: mode === 'unique' ? 'Unique 🔒' : 'Multiple 🔓', inline: true }
            )
            .setColor(0x0099FF)
            .setTimestamp();

        await interaction.deferReply();
        const message = await interaction.followUp({ embeds: [embed] });

        try {
            // Application séquentielle de chaque émoji sur le message
            for (const emoji of reactions) {
                await message.react(emoji).catch(() => {});
            }

            const db = await getPDO();
            const finAt = new Date(Date.now() + duration * 60 * 1000)
                .toISOString()
                .slice(0, 19)
                .replace('T', ' ');

            // Enregistrement en base de données
            await db.execute(
                "INSERT INTO polls (message_id, channel_id, question, fin_at, vote_mode) VALUES (?, ?, ?, ?, ?)",
                [message.id, message.channelId, question, finAt, mode]
            );
        } catch (e) {
            console.error("Erreur Sondage / BDD :", e.message);
        }
    }
};