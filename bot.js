const { Client, GatewayIntentBits, Partials, ActivityType, Collection, REST, Routes, Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');
const cron = require('node-cron');
const axios = require('axios');

// Importation de la base de données
const { getPDO } = require('./utils/database');

// Importation du système d'XP instancié
const XPSystem = require('./src/events/xp/XPSystem');
const xpSystem = new XPSystem();

// Importation du vérificateur de sondages
const PollChecker = require('./src/events/poll/PollChecker');

// Importation de la route Express pour la carte de localisation ISS
const mapRoutePath = fs.existsSync(path.join(__dirname, 'src', 'utils', 'IssLocalisation.js'))
    ? './src/utils/IssLocalisation'
    : './utils/IssLocalisation';
const mapRoute = require(mapRoutePath);

const RELOAD_COMMANDS = true;
// const GUILD_ID = process.env.DISCORD_SERVER_ID;
const startTime = process.hrtime();
const token = process.env.DISCORD_TOKEN1 || process.env.DISCORD_TOKEN;

// Fonction de chargement récursive des commandes
function getCommandFiles(dir = path.join(__dirname, 'commands')) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir, { withFileTypes: true });
    list.forEach(file => {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            results = results.concat(getCommandFiles(filePath));
        } else if (file.isFile() && /^([A-Z][A-Za-z0-9]*)Command\.js$/.test(file.name)) {
            results.push(filePath);
        }
    });
    return results;
}

console.log("Lancement du bot...");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();

// 1. Chargement des commandes au démarrage
const commandFiles = getCommandFiles();
const commandArray = [];

for (const file of commandFiles) {
    const command = require(file);
    if ('data' in command && 'execute' in command) {
        const folderName = path.basename(path.dirname(file));
        if (!command.category && folderName !== 'commands') {
            command.category = folderName;
        }

        client.commands.set(command.data.name, command);
        commandArray.push(command.data.toJSON());
    } else {
        console.log(`❌ La commande dans ${file} manque de propriétés 'data' ou 'execute'.`);
    }
}

// Affichage du détail des commandes par catégorie
console.log("\n📁 --- DÉTAIL DES COMMANDES PAR CATÉGORIE ---");
const categoriesMap = {};
client.commands.forEach(cmd => {
    const cat = cmd.category || 'Default';
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push(cmd.data.name);
});

for (const [cat, cmds] of Object.entries(categoriesMap)) {
    console.log(`📂 [${cat}] (${cmds.length}) : ${cmds.map(c => `/${c}`).join(', ')}`);
}
console.log("---------------------------------------------\n");

// 2. Chargement récursif automatique des événements
const eventsPath = fs.existsSync(path.join(__dirname, 'src', 'events'))
    ? path.join(__dirname, 'src', 'events')
    : path.join(__dirname, 'events');

function getEventFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir, { withFileTypes: true });
    list.forEach(file => {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            results = results.concat(getEventFiles(filePath));
        } else if (file.isFile() && file.name.endsWith('.js')) {
            results.push(filePath);
        }
    });
    return results;
}

if (fs.existsSync(eventsPath)) {
    const eventFiles = getEventFiles(eventsPath);
    console.log(`📡 Chargement de ${eventFiles.length} événement(s)...`);

    for (const filePath of eventFiles) {
        const event = require(filePath);
        if (event.name && typeof event.execute === 'function') {
            client.on(event.name, (...args) => event.execute(...args, client));
            console.log(`  ➡️ Événement chargé : ${path.basename(filePath)} (${event.name})`);
        }
    }
}

// Fonction d'envoi automatique de l'APOD
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
        const [rows] = await db.query("SELECT channel_id FROM apod_config");

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

// 3. Événement d'initialisation du bot (Utilisation directe de 'clientReady')
client.once('clientReady', async () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds + nanoseconds / 1e9;

    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    console.log(`🚀 Démarrage en ${duration.toFixed(2)} sec`);

    client.user.setActivity("/help pour obtenir de l'aide", { type: ActivityType.Playing });

    // Planification de l'APOD quotidienne à 09h00
    cron.schedule('0 9 * * *', async () => {
        console.log("⏰ Exécution de l'envoi automatique APOD...");
        await sendDailyApod(client);
    });

    // Enregistrement des commandes slash
    // if (RELOAD_COMMANDS) {
    //     const rest = new REST({ version: '10' }).setToken(token);
    //     try {
    //         console.log(`🧹 Nettoyage des anciennes commandes et enregistrement de ${commandArray.length} commande(s)...`);
    //         
    //         if (GUILD_ID) {
    //             await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
    //             const data = await rest.put(
    //                 Routes.applicationGuildCommands(client.user.id, GUILD_ID),
    //                 { body: commandArray },
    //             );
    //             console.log(`✅ ${data.length} commande(s) slash enregistrée(s) avec succès sur le serveur !`);
    //         } else {
    //             await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
    //             const data = await rest.put(
    //                 Routes.applicationCommands(client.user.id),
    //                 { body: commandArray },
    //             );
    //             console.log(`✅ ${data.length} commande(s) slash globale(s) enregistrée(s) avec succès !`);
    //         }
    //     } catch (error) {
    //         console.error("❌ Erreur lors du rechargement des commandes :", error);
    //     }
    // }

    if (RELOAD_COMMANDS) {
    const rest = new REST({ version: '10' }).setToken(token);
    try {
        console.log(`🧹 Enregistrement global de ${commandArray.length} commande(s)...`);
        
        const data = await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commandArray },
        );
        console.log(`✅ ${data.length} commande(s) slash globale(s) enregistrée(s) avec succès !`);
    } catch (error) {
        console.error("❌ Erreur lors du rechargement des commandes :", error);
    }
}

    // Démarrage du vérificateur de fin de sondages
    try {
        const pollChecker = new PollChecker(client);
        pollChecker.start();
        console.log("📊 PollChecker démarré avec succès.");
    } catch (err) {
        console.error("❌ Erreur au démarrage du PollChecker :", err.message);
    }
});

// Écoute des messages texte (Système XP)
client.on(Events.MessageCreate, (message) => {
    xpSystem.handleMessage(message, client);
});

// Écoute des interactions
client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            await interaction.reply({ content: `Commande inconnue : \`${interaction.commandName}\``, flags: 64 });
            return;
        }
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Une erreur est survenue lors de l\'exécution de cette commande !', flags: 64 });
            } else {
                await interaction.reply({ content: 'Une erreur est survenue lors de l\'exécution de cette commande !', flags: 64 });
            }
        }
    } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
        const customId = interaction.customId;

        if (customId === 'help_select_category' || customId === 'help_home' || customId.startsWith('help_nav_')) {
            const command = client.commands.get('help');
            if (command && command.handleInteraction) {
                await command.handleInteraction(interaction, client);
            }
        } else if (customId.startsWith('warnlist_')) {
            const command = client.commands.get('warnlist');
            if (command && command.handleButton) await command.handleButton(interaction, client);
        } else if (customId.startsWith('unwarn_delete_')) {
            const command = client.commands.get('unwarn');
            if (command && command.handleButton) await command.handleButton(interaction, client);
        } else if (customId.startsWith('history_')) {
            const command = client.commands.get('history');
            if (command && command.handleButton) await command.handleButton(interaction, client);
        } else if (customId.startsWith('apod_show_image_')) {
            const command = client.commands.get('apod');
            if (command && command.handleButton) await command.handleButton(interaction, client);
        } else if (customId.startsWith('prev:') || customId.startsWith('next:')) {
            const command = client.commands.get('meteorshowers');
            if (command && command.handleButton) await command.handleButton(interaction, client);
        } else if (customId === 'refresh_iss') {
            const command = client.commands.get('iss-location');
            if (command && command.handleButton) await command.handleButton(interaction, client);
        }
    }
});

// 4. Lancement du serveur Web Express local
const app = express();
const HTTP_PORT = process.env.PORT || 3000;

app.use('/LyamBot/utils', mapRoute);

app.listen(HTTP_PORT, () => {
    console.log(`🌐 Serveur d'images HTTP actif sur http://localhost:${HTTP_PORT}`);
});

client.login(token);