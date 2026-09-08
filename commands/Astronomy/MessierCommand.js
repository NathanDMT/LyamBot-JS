const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Astronomy',
    // 1. Définition de la commande Slash
    data: new SlashCommandBuilder()
        .setName('messier')
        .setDescription("Recherche un objet du catalogue Messier (Galaxies, Nébuleuses, Amas d'étoiles...)")
        .addStringOption(option =>
            option.setName('name')
                .setDescription("Nom, numéro ou constellation (ex: M31, M13, Pléiades, Hercule)")
                .setRequired(true)
        ),

    // 2. Exécution de la commande
    async execute(interaction, client) {
        await interaction.deferReply();

        const query = interaction.options.getString('name').trim().toLowerCase();
        const cleanQuery = query.startsWith('m') ? query : `m${query}`;
        const queryNumber = query.replace('m', '');

        try {
            // Catalogue de référence complet et étendu (Galaxies, Nébuleuses et Amas d'étoiles)
            const messierDatabase = [
                // --- GALAXIES ---
                { id: "M31", name: "Galaxie d'Andromède", type: "Galaxie spirale", constellation: "Andromède", distance: "2,5 millions d'années-lumière", magnitude: "3.4", description: "La galaxie d'Andromède est une galaxie spirale proche de notre Voie lactée et visible à l'œil nu.", image: "https://upload.wikimedia.org/wikipedia/commons/9/98/Andromeda_Galaxy_%28with_h-alpha%29.jpg" },
                { id: "M51", name: "Galaxie du Tourbillon", type: "Galaxie spirale", constellation: "Chiens de chasse", distance: "23 millions d'années-lumière", magnitude: "8.4", description: "Magnifique galaxie spirale grand design interagissant avec une galaxie satellite.", image: "https://upload.wikimedia.org/wikipedia/commons/d/db/M51_Hubble_Reprocessed.jpg" },
                { id: "M81", name: "Galaxie de Bode", type: "Galaxie spirale", constellation: "La Grande Ourse", distance: "12 millions d'années-lumière", magnitude: "6.9", description: "Une galaxie spirale lumineuse et spectaculaire découverte par Johann Elert Bode en 1774.", image: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Messier_81_Hst_Prism.jpg" },
                { id: "M82", name: "Galaxie du Cigare", type: "Galaxie irrésistible / starburst", constellation: "La Grande Ourse", distance: "12 millions d'années-lumière", magnitude: "8.4", description: "Galaxie irrégulière caractérisée par une intense formation de nouvelles étoiles.", image: "https://upload.wikimedia.org/wikipedia/commons/8/84/M82_HST_ACS_2006.jpg" },

                // --- NÉBULEUSES ---
                { id: "M1", name: "Nébuleuse du Crabe", type: "Reste de supernova", constellation: "Taureau", distance: "6 500 années-lumière", magnitude: "8.4", description: "Résidu d'une supernova historique observée en l'an 1054 par des astronomes chinois.", image: "https://upload.wikimedia.org/wikipedia/commons/0/00/Crab_Nebula.jpg" },
                { id: "M42", name: "Nébuleuse d'Orion", type: "Nébuleuse diffuse / pouponnière d'étoiles", constellation: "Orion", distance: "1 344 années-lumière", magnitude: "4.0", description: "Splendide nébuleuse diffuse visible à l'œil nu, haut lieu de formation stellaire.", image: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Orion_Nebula_Hubble_2006_mosaic_1_%28cropped%29.jpg" },
                { id: "M57", name: "Nébuleuse de la Lyre (Ring Nebula)", type: "Nébuleuse planétaire", constellation: "La Lyre", distance: "2 570 années-lumière", magnitude: "8.8", description: "Célèbre nébuleuse planétaire en forme d'anneau, issue d'une étoile mourante.", image: "https://upload.wikimedia.org/wikipedia/commons/c/c5/M57_The_Ring_Nebula%2C_Hubble_%282013-12-18%29.jpg" },
                { id: "M8", name: "Nébuleuse de la Lagune", type: "Nébuleuse en émission / Amas ouvert", constellation: "Le Sagittaire", distance: "4 100 années-lumière", magnitude: "6.0", description: "Immense nuage de gaz interstellaire abritant une active pouponnière d'étoiles.", image: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Lagoon_Nebula_%28no_watermark%29.jpg" },
                { id: "M16", name: "Nébuleuse de l'Aigle (Piliers de la Création)", type: "Nébuleuse diffuse / Amas ouvert", constellation: "Le Serpent", distance: "5 700 années-lumière", magnitude: "6.0", description: "Célèbre pour ses 'Piliers de la Création', d'immenses colonnes de gaz et de poussières.", image: "https://upload.wikimedia.org/wikipedia/commons/6/68/Pillars_of_creation_2014_HST_WFC3_UVIS_full-res_denoised.jpg" },

                // --- AMAS D'ÉTOILES (AMAS GLOBULAIRES & OUVERTS) ---
                { id: "M13", name: "Grand Amas d'Hercule", type: "Amas globulaire", constellation: "Hercule", distance: "22 200 années-lumière", magnitude: "5.8", description: "L'un des plus magnifiques et brillants amas globulaires de l'hémisphère nord, contenant des centaines de milliers d'étoiles.", image: "https://upload.wikimedia.org/wikipedia/commons/a/a2/M13_%28globular_cluster%29.jpg" },
                { id: "M3", name: "Amas M3", type: "Amas globulaire", constellation: "Les Chiens de chasse", distance: "33 900 années-lumière", magnitude: "6.2", description: "L'un des plus grands et lumineux amas globulaires, abritant plus de 500 000 étoiles.", image: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Messier_3_HST.jpg" },
                { id: "M22", name: "Amas du Sagittaire", type: "Amas globulaire", constellation: "Le Sagittaire", distance: "10 600 années-lumière", magnitude: "5.1", description: "L'un des amas globulaires les plus proches de la Terre et l'un des plus spectaculaires.", image: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Messier_22_-_Habble_-_PRC2000-04.jpg" },
                { id: "M45", name: "Les Pléiades (Amas ouvert)", type: "Amas ouvert", constellation: "Le Taureau", distance: "444 années-lumière", magnitude: "1.6", description: "Amas ouvert très célèbre, facilement visible à l'œil nu, baigné dans de superbes nébuleuses par réflexion.", image: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Pleiades_large.jpg" },
                { id: "M44", name: "La Crèche / Praesepe", type: "Amas ouvert", constellation: "Le Cancer", distance: "610 années-lumière", magnitude: "3.7", description: "Amas ouvert lumineux visible à l'œil nu sous forme d'une tache laiteuse.", image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/M44_Praesepe_Amas_de_la_Ruche_par_NOAO.jpg" },
                { id: "M6", name: "Amas du Papillon", type: "Amas ouvert", constellation: "Le Scorpion", distance: "1 600 années-lumière", magnitude: "4.2", description: "Amas ouvert dont la disposition des étoiles évoque la forme d'un papillon aux ailes déployées.", image: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Messier_6_Wide_Field_View.jpg" },
                { id: "M7", name: "Amas de Ptolémée", type: "Amas ouvert", constellation: "Le Scorpion", distance: "980 années-lumière", magnitude: "3.3", description: "Grand amas ouvert déjà mentionné dès l'Antiquité par l'astronome Claude Ptolémée.", image: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Messier_7_Wide_Field_View.jpg" }
            ];

            // Recherche intelligente élargie (par ID, numéro exact, nom ou constellation)
            const foundObject = messierDatabase.find(item => {
                const itemIdLower = item.id.toLowerCase();
                const itemNum = itemIdLower.replace('m', '');
                return (
                    itemIdLower === query || 
                    itemIdLower === cleanQuery ||
                    itemNum === queryNumber ||
                    item.name.toLowerCase().includes(query) ||
                    item.constellation.toLowerCase().includes(query) ||
                    item.type.toLowerCase().includes(query)
                );
            });

            if (!foundObject) {
                await interaction.editReply({
                    content: `❌ Impossible de trouver l'objet \`${query}\` dans l'encyclopédie Messier (Galaxies, Nébuleuses, Amas).`
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`🔭 Objet Messier : ${foundObject.id} - ${foundObject.name}`)
                .setDescription(foundObject.description)
                .addFields(
                    { name: "🌌 Type", value: foundObject.type, inline: true },
                    { name: "✨ Constellation", value: foundObject.constellation, inline: true },
                    { name: "🔭 Magnitude", value: foundObject.magnitude, inline: true },
                    { name: "📏 Distance", value: foundObject.distance, inline: true }
                )
                .setColor(0x3498DB)
                .setFooter({ text: "Encyclopédie du Ciel Profond • Catalogue Messier" })
                .setTimestamp();

            if (foundObject.image) {
                embed.setImage(foundObject.image);
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Erreur Messier :", error);
            await interaction.editReply({
                content: `❌ Une erreur est survenue : ${error.message}`
            });
        }
    }
};