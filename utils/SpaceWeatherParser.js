const axios = require('axios');

module.exports = {
    async getKp() {
        const headers = { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        };

        // 1. Appel NordAPI (lecture de la structure réelle : res.data.data)
        try {
            const res = await axios.get('https://nordapi.ee/api/v1/spaceweather/kp', { headers, timeout: 5000 });
            
            if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
                const latest = res.data.data[res.data.data.length - 1];
                const rawVal = latest?.kp_index ?? latest?.kp ?? latest?.value;
                
                if (rawVal !== undefined && rawVal !== null) {
                    const parsed = parseFloat(rawVal);
                    if (!isNaN(parsed)) return parsed.toFixed(1);
                }
            }
        } catch (e) {
            console.error("Erreur NordAPI Kp :", e.message);
        }

        // 2. Fallback SWPC NOAA (utilisant l'élément "Kp" mis en évidence dans tes logs)
        try {
            const noaaRes = await axios.get('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', { headers, timeout: 5000 });
            if (noaaRes.data && Array.isArray(noaaRes.data) && noaaRes.data.length > 1) {
                for (let i = noaaRes.data.length - 1; i > 0; i--) {
                    const val = noaaRes.data[i][1];
                    if (val !== undefined && val !== null && val !== '' && !isNaN(parseFloat(val))) {
                        return parseFloat(val).toFixed(1);
                    }
                }
            }
        } catch (e) {
            console.error("Erreur NOAA Kp :", e.message);
        }

        return 'N/A';
    },

    async getLatestFlare() {
        try {
            const response = await axios.get('https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json', {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 5000
            });

            if (response.data) {
                const flares = response.data;
                const flare = Array.isArray(flares) ? flares[flares.length - 1] : flares;
                if (flare && flare.max_class) {
                    const timeStr = flare.max_time ? flare.max_time.replace('T', ' ').replace('Z', ' UTC') : 'Inconnu';
                    return `Classe : **${flare.max_class}** (Pic à ${timeStr})`;
                }
            }
            return "Aucune éruption majeure récente";
        } catch (error) {
            return "Aucune éruption majeure récente";
        }
    }
};