const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
    category: 'Astronomy',
    data: new SlashCommandBuilder()
        .setName('marsrover')
        .setDescription("Affiche une photo brute d'un rover martien")
        .addStringOption(option =>
            option.setName('rover')
                .setDescription("Choisissez le rover (Perseverance par défaut)")
                .setRequired(false)
                .addChoices(
                    { name: 'Perseverance', value: 'perseverance' },
                    { name: 'Curiosity', value: 'curiosity' }
                )
        )
        .addStringOption(option =>
            option.setName('date')
                .setDescription("Date au format DD/MM/YYYY (laisser vide pour aujourd'hui)")
                .setRequired(false)
        ),

    async execute(interaction, client) {
        await interaction.deferReply();

        const selectedRover = interaction.options.getString('rover') || 'perseverance';
        const roverName = selectedRover.toUpperCase();

        // 1. Définition de la date
        const now = new Date();
        const defaultDay = String(now.getDate()).padStart(2, '0');
        const defaultMonth = String(now.getMonth() + 1).padStart(2, '0');
        const defaultYear = now.getFullYear();

        let displayDate = `${defaultDay}/${defaultMonth}/${defaultYear}`;
        let targetApiDate = `${defaultYear}-${defaultMonth}-${defaultDay}`;

        const inputDate = interaction.options.getString('date');

        if (inputDate) {
            const match = inputDate.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
            if (match) {
                const [, day, month, year] = match;
                displayDate = `${day}/${month}/${year}`;
                targetApiDate = `${year}-${month}-${day}`;
            } else {
                await interaction.editReply({
                    content: "❌ Format de date invalide ! Utilise le format **DD/MM/YYYY** (ex: `27/01/2026`)."
                });
                return;
            }
        }

        try {
            let images = [];
            let isFallback = false;

            if (selectedRover === 'perseverance') {
                // Tentative 1 : Recherche sur l'API Mars 2020 Raw à la date demandée
                const res = await axios.get('https://mars.nasa.gov/mars2020-raw-images/image-curator/', {
                    params: {
                        feedtype: 'json',
                        endpoint: 'images',
                        extended: 'sample_type::full',
                        earth_date: targetApiDate,
                        page: 0,
                        num: 100
                    },
                    timeout: 8000
                }).catch(() => null);

                if (res?.data?.images && res.data.images.length > 0) {
                    images = res.data.images;
                } else {
                    // Tentative 2 (Fallback) : Récupération du flux général le plus récent si 0 photo à cette date
                    isFallback = true;
                    const fallbackRes = await axios.get('https://mars.nasa.gov/mars2020-raw-images/image-curator/', {
                        params: {
                            feedtype: 'json',
                            endpoint: 'images',
                            extended: 'sample_type::full',
                            page: 0,
                            num: 100
                        },
                        timeout: 8000
                    }).catch(() => null);

                    images = fallbackRes?.data?.images || [];
                }
            } else {
                // Recherche pour Curiosity via l'API globale NASA Images
                const response = await axios.get('https://images-api.nasa.gov/search', {
                    params: { q: 'curiosity rover', media_type: 'image' },
                    timeout: 8000
                }).catch(() => null);

                const items = response?.data?.collection?.items || [];
                images = items.map(item => ({
                    image_files: { medium: item.links?.[0]?.href },
                    title: item.data?.[0]?.title,
                    date_taken_utc: item.data?.[0]?.date_created,
                    camera: { full_name: 'NASA Archive' }
                }));
            }

            // 2. Vérification finale du tableau d'images
            if (!images || images.length === 0) {
                await interaction.editReply({
                    content: `❌ Aucune image disponible pour **${roverName}**. L'API NASA ne renvoie aucune donnée pour le moment.`
                });
                return;
            }

            // 3. Tirage aléatoire
            const randomIndex = Math.floor(Math.random() * images.length);
            const selectedImage = images[randomIndex];

            const imageUrl = selectedImage.image_files?.medium || selectedImage.image_files?.full_res || selectedImage.image_files?.large;
            const cameraName = selectedImage.camera?.full_name || selectedImage.camera?.name || 'Caméra Martienne';
            const solInfo = selectedImage.sol !== undefined ? ` (Sol ${selectedImage.sol})` : '';
            const photoDate = selectedImage.date_taken_utc ? selectedImage.date_taken_utc.substring(0, 10) : displayDate;

            let descriptionText = `**Caméra :** ${cameraName}\n**Titre :** ${selectedImage.title || 'Cliché brut martien'}`;
            if (isFallback) {
                descriptionText += `\n\n*(Note : Aucune transmission reçue le ${displayDate}, affichage des derniers clichés enregistrés)*`;
            }

            const embed = new EmbedBuilder()
                .setTitle(`🔴 Mars Rover : ${roverName}${solInfo}`)
                .setDescription(descriptionText)
                .setColor(0xCC5500)
                .setFooter({ text: `Mars 2020 Raw API • Date : ${photoDate}` })
                .setTimestamp();

            // 4. Téléchargement et envoi du fichier
            if (imageUrl && /\.(jpg|jpeg|png)(\?.*)?$/i.test(imageUrl)) {
                const tempFilename = `mars_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
                const tempPath = path.join(os.tmpdir(), tempFilename);

                const imageStream = await axios({
                    url: imageUrl,
                    method: 'GET',
                    responseType: 'stream',
                    timeout: 10000
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

                setTimeout(() => {
                    if (fs.existsSync(tempPath)) {
                        fs.unlinkSync(tempPath);
                    }
                }, 5000);
            } else if (imageUrl) {
                embed.setImage(imageUrl);
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({
                    content: `❌ L'image sélectionnée ne comporte aucun lien de téléchargement valide.`
                });
            }

        } catch (error) {
            console.error("❌ Erreur MarsRover :", error.message);
            await interaction.editReply({
                content: `❌ Erreur lors de la récupération de la photo martienne : ${error.message}`
            });
        }
    }
};