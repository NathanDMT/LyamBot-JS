const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
    // 1. Définition de la commande Slash
    data: new SlashCommandBuilder()
        .setName('jwst')
        .setDescription("Affiche une image spectaculaire du télescope spatial James Webb (JWST)"),

    // 2. Traitement principal de la commande
    async execute(interaction, client) {
        await interaction.deferReply();

        // Utilisation de l'API NASA (ou d'une source publique JWST alternative si besoin)
        // L'API MAESTRO / STScI ou un flux d'images JWST publics via l'API NASA/Flickr/STScI
        const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

        try {
            // Recherche ciblée sur les objets JWST via l'API NASA (ou alternative open data)
            // On interroge l'API image/video de la NASA avec le mot-clé "JWST" pour obtenir les dernières pépites
            const response = await axios.get('https://images-api.nasa.gov/search', {
                params: {
                    q: 'JWST',
                    media_type: 'image'
                }
            });

            const items = response.data.collection.items;

            if (!items || items.length === 0) {
                await interaction.editReply({
                    content: "❌ Aucune image du JWST n'a pu être récupérée pour le moment."
                });
                return;
            }

            // On prend un résultat aléatoire ou le premier de la liste récente
            const randomIndex = Math.floor(Math.random() * Math.min(items.length, 15));
            const selectedItem = items[randomIndex];
            
            const dataInfo = selectedItem.data[0];
            const imageUrl = selectedItem.links[0].href;

            const embed = new EmbedBuilder()
                .setTitle(dataInfo.title || 'James Webb Space Telescope')
                .setDescription(dataInfo.description ? dataInfo.description.substring(0, 4000) : 'Aucune description disponible.')
                .setColor(0x104E8B)
                .setFooter({ text: `JWST • NASA / STScI • Date : ${dataInfo.date_created ? dataInfo.date_created.slice(0, 10) : 'Inconnue'}` });

            if (imageUrl && /\.(jpg|jpeg|png)$/i.test(imageUrl)) {
                const tempFilename = `jwst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
                const tempPath = path.join(os.tmpdir(), tempFilename);

                const imageStream = await axios({
                    url: imageUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                const writer = fs.createWriteStream(tempPath);
                imageStream.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                const attachment = new AttachmentBuilder(tempPath, { name: tempFilename });
                embed.setImage(`attachment://${tempFilename}`);

                await interaction.editReply({
                    embeds: [embed],
                    files: [attachment]
                });

                // Nettoyage du fichier temporaire après 5 secondes
                setTimeout(() => {
                    if (fs.existsSync(tempPath)) {
                        fs.unlinkSync(tempPath);
                    }
                }, 5000);
            } else {
                embed.setImage(imageUrl);
                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: `❌ Erreur lors de la récupération de l'image JWST : ${error.message}`
            });
        }
    }
};