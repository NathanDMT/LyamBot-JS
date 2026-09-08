const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getPDO } = require('../../../utils/database');
const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // Planification quotidienne à 09:00 chaque jour
        cron.schedule('0 9 * * *', async () => {
            console.log("⏰ Exécution de l'envoi automatique JWST...");
            await sendDailyJwst(client);
        });
    }
};

async function sendDailyJwst(client) {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY'; 

    // Date du jour par défaut
    const now = new Date();
    const currentDay = String(now.getDate()).padStart(2, '0');
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();

    const displayDate = `${currentDay}-${currentMonth}-${currentYear}`; // JJ-MM-AAAA
    const targetApiDate = `${currentYear}-${currentMonth}-${currentDay}`; // AAAA-MM-JJ
    
    try {
        const db = await getPDO();
        // On récupère les salons configurés pour le JWST
        const [rows] = await db.execute("SELECT channel_id FROM jwst_config");

        if (!rows || rows.length === 0) return;

        // Recherche ciblée sur les objets JWST via l'API NASA Images
        const response = await axios.get('https://images-api.nasa.gov/search', {
            params: {
                q: 'JWST',
                media_type: 'image'
            }
        });

        const items = response.data.collection.items;

        if (!items || items.length === 0) {
            console.log("❌ Aucune image du JWST n'a pu être récupérée pour le cron.");
            return;
        }

        // On cherche en priorité une image du jour exact, sinon on pioche dans les plus récentes
        let selectedItem = items.find(item => {
            const dateCreated = item.data[0]?.date_created;
            return dateCreated && dateCreated.startsWith(targetApiDate);
        });

        if (!selectedItem) {
            const randomIndex = Math.floor(Math.random() * Math.min(items.length, 15));
            selectedItem = items[randomIndex];
        }
        
        const dataInfo = selectedItem.data[0];
        const imageUrl = selectedItem.links[0].href;
        const itemDate = dataInfo.date_created ? dataInfo.date_created.slice(0, 10) : displayDate;

        // Envoi dans chaque salon configuré
        for (const row of rows) {
            const channel = await client.channels.fetch(row.channel_id).catch(() => null);
            if (!channel) continue;

            const embed = new EmbedBuilder()
                .setTitle(`🔭 Observation JWST : ${dataInfo.title || 'James Webb Space Telescope'}`)
                .setDescription(dataInfo.description ? dataInfo.description.substring(0, 4000) : 'Aucune description disponible.')
                .setColor(0x104E8B)
                .setFooter({ text: `JWST • NASA / STScI • Date : ${itemDate}` });

            // Traitement et téléchargement de l'image
            if (imageUrl && /\.(jpg|jpeg|png)$/i.test(imageUrl)) {
                const tempFilename = `jwst_cron_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
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

                await channel.send({ embeds: [embed], files: [attachment] });

                // Nettoyage du fichier temporaire après 5 secondes
                setTimeout(() => {
                    if (fs.existsSync(tempPath)) {
                        fs.unlinkSync(tempPath);
                    }
                }, 5000);
            } else {
                if (imageUrl) embed.setImage(imageUrl);
                await channel.send({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors du Cron JWST :", error.message);
    }
}