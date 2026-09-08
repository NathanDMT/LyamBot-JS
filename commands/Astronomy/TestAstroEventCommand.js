const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getPDO } = require('../../utils/database');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
    category: 'Astronomy',
    data: new SlashCommandBuilder()
        .setName('testastroevent')
        .setDescription("🧪 Force l'envoi immédiat des images (APOD / JWST) pour tester la configuration"),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "🔒 Tu dois être administrateur pour exécuter ce test.",
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const db = await getPDO();
            const serverId = interaction.guildId;

            // Récupération des configurations
            const [apodRows] = await db.query("SELECT channel_id FROM apod_config WHERE server_id = ?", [serverId]);
            const [jwstRows] = await db.query("SELECT channel_id FROM jwst_config WHERE server_id = ?", [serverId]);

            if ((!apodRows || apodRows.length === 0) && (!jwstRows || jwstRows.length === 0)) {
                return interaction.editReply({
                    content: "⚠️ Aucun salon n'est configuré pour ce serveur (ni APOD, ni JWST). Utilise d'abord la commande `/setastrochannels`."
                });
            }

            let responseMessage = "";
            const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

            // ==========================================
            // 1. TEST APOD
            // ==========================================
            if (apodRows && apodRows.length > 0) {
                const apodChannelId = apodRows[0].channel_id;
                const apodChannel = await client.channels.fetch(apodChannelId).catch(() => null);

                if (!apodChannel) {
                    responseMessage += `❌ Le salon APOD (<#${apodChannelId}>) est introuvable.\n`;
                } else {
                    const now = new Date();
                    const day = String(now.getDate()).padStart(2, '0');
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const year = now.getFullYear();

                    const displayDate = `${day}-${month}-${year}`;
                    const apiDate = `${year}-${month}-${day}`;

                    const response = await axios.get('https://api.nasa.gov/planetary/apod', {
                        params: { api_key: apiKey, date: apiDate }
                    });

                    const data = response.data;
                    const imageUrl = data.url || data.hdurl || null;

                    const embed = new EmbedBuilder()
                        .setTitle(`🌌 APOD du jour : ${data.title || 'Image Astronomique'}`)
                        .setURL(data.url || null)
                        .setDescription(data.explanation ? data.explanation.substring(0, 4000) : '')
                        .setColor(0x005288)
                        .setFooter({ text: `Astronomy Picture of the Day • ${displayDate}` });

                    if (data.media_type === 'image' && imageUrl && /\.(jpg|jpeg|png|gif)$/i.test(imageUrl)) {
                        const tempFilename = `apod_test_${Date.now()}.jpg`;
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

                        await apodChannel.send({ embeds: [embed], files: [attachment] });

                        setTimeout(() => {
                            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                        }, 5000);
                    } else {
                        if (data.url) embed.addFields({ name: "🎥 Médium vidéo", value: data.url });
                        await apodChannel.send({ embeds: [embed] });
                    }
                    responseMessage += `✅ Test APOD réussi dans <#${apodChannelId}>.\n`;
                }
            }

            // ==========================================
            // 2. TEST JWST (Intégration de ton code)
            // ==========================================
            if (jwstRows && jwstRows.length > 0) {
                const jwstChannelId = jwstRows[0].channel_id;
                const jwstChannel = await client.channels.fetch(jwstChannelId).catch(() => null);

                if (!jwstChannel) {
                    responseMessage += `❌ Le salon JWST (<#${jwstChannelId}>) est introuvable.\n`;
                } else {
                    const response = await axios.get('https://images-api.nasa.gov/search', {
                        params: { q: 'JWST', media_type: 'image' }
                    });

                    const items = response.data.collection.items;

                    if (!items || items.length === 0) {
                        responseMessage += `❌ Aucune image du JWST n'a pu être récupérée pour le test.\n`;
                    } else {
                        const randomIndex = Math.floor(Math.random() * Math.min(items.length, 15));
                        const selectedItem = items[randomIndex];
                        
                        const dataInfo = selectedItem.data[0];
                        const imageUrl = selectedItem.links[0].href;

                        const jwstEmbed = new EmbedBuilder()
                            .setTitle(`🔭 JWST : ${dataInfo.title || 'James Webb Space Telescope'}`)
                            .setDescription(dataInfo.description ? dataInfo.description.substring(0, 4000) : 'Aucune description disponible.')
                            .setColor(0x104E8B)
                            .setFooter({ text: `JWST Test • Date : ${dataInfo.date_created ? dataInfo.date_created.slice(0, 10) : 'Inconnue'}` });

                        if (imageUrl && /\.(jpg|jpeg|png)$/i.test(imageUrl)) {
                            const tempFilename = `jwst_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
                            const tempPath = path.join(os.tmpdir(), tempFilename);

                            const imageStream = await axios({ url: imageUrl, method: 'GET', responseType: 'stream' });
                            const writer = fs.createWriteStream(tempPath);
                            imageStream.data.pipe(writer);

                            await new Promise((resolve, reject) => {
                                writer.on('finish', resolve);
                                writer.on('error', reject);
                            });

                            const attachment = new AttachmentBuilder(tempPath, { name: tempFilename });
                            jwstEmbed.setImage(`attachment://${tempFilename}`);

                            await jwstChannel.send({ embeds: [jwstEmbed], files: [attachment] });

                            setTimeout(() => {
                                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                            }, 5000);
                        } else {
                            jwstEmbed.setImage(imageUrl);
                            await jwstChannel.send({ embeds: [jwstEmbed] });
                        }
                        responseMessage += `✅ Test JWST réussi dans <#${jwstChannelId}>.\n`;
                    }
                }
            }

            // Réponse finale
            await interaction.editReply({ content: responseMessage });

        } catch (error) {
            console.error("❌ Erreur testastroevent :", error);
            await interaction.editReply({
                content: `❌ Une erreur est survenue pendant le test : ${error.message}`
            });
        }
    }
};