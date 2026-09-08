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
        // Planification quotidienne à 09:00 chaque jour (format Cron: Sec Min Heure Jour Mois JourSemaine)
        cron.schedule('0 9 * * *', async () => {
            console.log("⏰ Exécution de l'envoi automatique APOD...");
            await sendDailyApod(client);
        });
    }
};

async function sendDailyApod(client) {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const displayDate = `${day}-${month}-${year}`;
    const apiDate = `${year}-${month}-${day}`;

    try {
        const db = await getPDO();
        const [rows] = await db.execute("SELECT channel_id FROM apod_config");

        if (!rows || rows.length === 0) return;

        const response = await axios.get('https://api.nasa.gov/planetary/apod', {
            params: { api_key: apiKey, date: apiDate }
        });

        const data = response.data;
        const imageUrl = data.url || data.hdurl || null;

        for (const row of rows) {
            const channel = await client.channels.fetch(row.channel_id).catch(() => null);
            if (!channel) continue;

            const embed = new EmbedBuilder()
                .setTitle(`🌌 APOD du jour : ${data.title || 'Image Astronomique'}`)
                .setURL(data.url || null)
                .setDescription(data.explanation ? data.explanation.substring(0, 4000) : '')
                .setColor(0x005288)
                .setFooter({ text: `Astronomy Picture of the Day • ${displayDate}` });

            if (data.media_type === 'image' && imageUrl && /\.(jpg|jpeg|png|gif)$/i.test(imageUrl)) {
                const tempFilename = `apod_cron_${Date.now()}.jpg`;
                const tempPath = path.join(os.tmpdir(), tempFilename);

                const imageStream = await axios({ url: imageUrl, method: 'GET', responseType: 'stream' });
                const writer = fs.createWriteStream(tempPath);
                imageStream.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                const attachment = new AttachmentBuilder(tempPath, { name: tempFilename });
                embed.setImage(`attachment://${tempFilename}`);

                await channel.send({ embeds: [embed], files: [attachment] });

                setTimeout(() => {
                    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                }, 5000);
            } else {
                if (data.url) embed.addFields({ name: "🎥 Médium vidéo", value: data.url });
                await channel.send({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors du Cron APOD :", error.message);
    }
}