/**
 * Extension utilitaire pour appliquer un tableau de choix dynamique
 * à une option SlashCommandStringOption (équivalent strict de ExtendedOption PHP).
 */
class ExtendedOption {
    /**
     * Applique un tableau d'objets ou de paires clé/valeur aux choix de l'option.
     * @param {import('discord.js').SlashCommandStringOption} option - L'option discord.js à modifier
     * @param {Array<{name: string, value: string}>|Object} choices - Tableau de choix ou objet { label: valeur }
     * @returns {import('discord.js').SlashCommandStringOption}
     */
    static setChoices(option, choices) {
        if (Array.isArray(choices)) {
            option.addChoices(...choices);
        } else if (typeof choices === 'object' && choices !== null) {
            const formattedChoices = Object.entries(choices).map(([name, value]) => ({
                name: String(name),
                value: String(value)
            }));
            option.addChoices(...formattedChoices);
        }
        return option;
    }
}

module.exports = ExtendedOption;