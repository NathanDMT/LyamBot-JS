const { MessageFlags } = require('discord.js');

/**
 * Envoie une réponse standard à une interaction.
 * Équivalent strict de respondWithMessage() dans InteractionResponseHelper.php
 * 
 * @param {import('discord.js').Interaction} interaction 
 * @param {string} message 
 * @param {boolean} ephemeral 
 */
async function respondWithMessage(interaction, message, ephemeral = false) {
    const options = {
        content: message
    };

    if (ephemeral) {
        options.flags = MessageFlags.Ephemeral; // Équivalent du flag 64 en PHP
    }

    if (interaction.replied || interaction.deferred) {
        await interaction.followUp(options);
    } else {
        await interaction.reply(options);
    }
}

module.exports = { respondWithMessage };