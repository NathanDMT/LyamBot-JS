# 🌌 Lyam — Bot Discord Polyvalent & Astronomie

[![Discord.js](https://img.shields.io/badge/discord.js-v14.14.0-blue.svg?logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A5%2018.0.0-brightgreen.svg?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![SQLite3](https://img.shields.io/badge/Database-SQLite3-003B57.svg?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Lyam** est un bot Discord complet, moderne et modulaire écrit en JavaScript (**discord.js v14**). Il combine un module d'**Astronomie & Espace** extrêmement poussé (APOD, suivi ISS, éruptions solaires, télescope James Webb, etc.), un système complet de **Modération & Logs**, un système d'**XP & Niveaux**, un créateur de **Sondages interactifs**, ainsi que divers **Jeux** et **Utilitaires**.

---

## 📸 Aperçu & Fonctionnalités Clés

- 🪐 **Astronomie & Espace complet** : Intégration directe des API NASA (APOD, Mars Rover, NEO), NOAA SWPC (Météo spatiale, Éruptions solaires) et suivi en temps réel de l'ISS avec rendu de carte HTTP local via Express.
- 🛡️ **Modération & Logging avancé** : Sanctions (`/ban`, `/kick`, `/mute`, `/warn`, `/purge`), registre d'historique SQLite et salon de logs automatisé (`ModLogger`).
- ⭐ **Système d'XP & Niveaux** : Gain d'XP par message (cooldown de 60s), génération de carte de classement (`/rank`) et configuration sur-mesure (`/xpconfig`).
- 📊 **Sondages & Notifications** : Sondages à expiration automatique (`PollChecker`), modes de vote unique/multiple et publications quotidiennes automatisées (Cron APOD/JWST).
- 🌐 **Mini-serveur HTTP Express** : Serveur intégré pour héberger et servir dynamiquement les éléments visuels de la carte ISS.

---

## 🛠️ Stack Technique

- **Runtime** : Node.js (v18.x ou v20.x+)
- **Library Discord** : `discord.js` v14
- **Base de Données** : `better-sqlite3` (Mode WAL activé)
- **Serveur Web** : Express.js
- **Tâches Planifiées** : `node-cron`
- **Requêtes HTTP** : `axios`
- **Variables d'Environnement** : `dotenv`

---

## 📂 Structure du Projet

```text
├── commands/               # Commandes Slash récursives classées par catégorie
│   ├── Astronomy/         # /apod, /iss-location, /iss-pass, /moonphase, /planets, /spaceweather, /marsrover, etc.
│   ├── Game/              # /coinflip, /dice
│   ├── Logs/              # /setmodlogchannel, /testchannel
│   ├── Moderation/        # /ban, /kick, /mute, /warn, /warnlist, /history, /purge, /unwarn
│   ├── Owner/             # /reload, /restart, /stop, /uptime, /xpconfig, /setprofile
│   └── Utility/           # /help, /poll, /botinfo, /annonce, /serverinfo, /userinfo
├── src/
│   ├── events/            # Événements Discord (MessageCreate, GuildMemberAdd, ReactionAdd, etc.)
│   │   ├── poll/          # PollChecker.js, PollReactionHandler.js
│   │   └── xp/            # XPSystem.js
│   └── utils/             # Express, cartes et modules utilitaires (IssLocalisation.js, etc.)
├── utils/
│   ├── database.js        # Connexion SQLite & création auto des tables
│   ├── ModLogger.js       # Module centralisé de logs
│   └── LogColors.js       # Palette de couleurs des embeds
├── .env                   # Variables d'environnement
├── bot.js                 # Point d'entrée principal du bot
└── package.json           # Dépendances du projet
