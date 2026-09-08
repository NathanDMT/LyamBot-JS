class LogColors {
    static COLORS = {
        'Warn': 0xFFA500,
        'Kick': 0x00AAFF,
        'Ban': 0xFF0000,
        'Unban': 0x00FF00,
        'Warnlist': 0x8A2BE2,
        'Userinfo': 0x8A2BE2,
        'Purge': 0xCCCCCC,
        'Mute': 0xFFFF00,
        'Test': 0xFFFF00,
    };

    static get(action) {
        return this.COLORS[action] ?? 0x5865F2;
    }
}

module.exports = LogColors;