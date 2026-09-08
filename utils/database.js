const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

function initDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS modlog_config (
            server_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            PRIMARY KEY (server_id, event_type)
        );

        CREATE TABLE IF NOT EXISTS event_config (
            server_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            PRIMARY KEY (server_id, event_type)
        );

        CREATE TABLE IF NOT EXISTS sanctions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            reason TEXT,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            moderator_id TEXT NOT NULL,
            server_id TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS warnings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            warned_by TEXT NOT NULL,
            reason TEXT NOT NULL,
            server_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS polls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            question TEXT NOT NULL,
            fin_at DATETIME NOT NULL,
            vote_mode TEXT DEFAULT 'multiple',
            is_closed INTEGER DEFAULT 0
        );

        -- 💡 Paramètres d'XP personnalisés par serveur
        CREATE TABLE IF NOT EXISTS xp_settings (
            server_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (server_id, key)
        );

        CREATE TABLE IF NOT EXISTS users_activity (
            user_id TEXT NOT NULL,
            guild_id TEXT NOT NULL,
            username TEXT,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 0,
            last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, guild_id)
        );

        -- 🌌 Configuration de l'envoi automatique quotidien APOD
        CREATE TABLE IF NOT EXISTS apod_config (
            server_id TEXT PRIMARY KEY,
            channel_id TEXT NOT NULL
        );

        -- 🔭 Configuration de l'envoi automatique quotidien JWST
        CREATE TABLE IF NOT EXISTS jwst_config (
            server_id TEXT PRIMARY KEY,
            channel_id TEXT NOT NULL
        );
    `);
    console.log("✅ Base de données SQLite initialisée avec succès.");
}

initDatabase();

async function getPDO() {
    return {
        async execute(query, params = []) {
            const stmt = db.prepare(query);
            return stmt.run(...params);
        },
        async query(query, params = []) {
            const stmt = db.prepare(query);
            if (query.trim().toUpperCase().startsWith('SELECT')) {
                const rows = stmt.all(...params);
                return [rows];
            } else {
                const result = stmt.run(...params);
                return [result];
            }
        }
    };
}

module.exports = { getPDO, db };