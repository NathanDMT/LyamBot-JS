const axios = require('axios');

module.exports = {
    async getShowers() {
        try {
            // 1. Tentative de récupération en ligne (API/JSON public)
            const response = await axios.get('https://raw.githubusercontent.com/amsmeteors/meteor-showers/main/showers.json', { 
                timeout: 4000 
            }).catch(() => null);

            if (response && Array.isArray(response.data) && response.data.length > 0) {
                return response.data;
            }

            // 2. Base de données locale de secours (AMS fallback)
            return [
                {
                    name: "Quadrantides",
                    period: "28 décembre - 12 janvier",
                    peak: "04-01-2026",
                    zhr: 110,
                    visibility: "Bonne dans l'hémisphère Nord en deuxième partie de nuit."
                },
                {
                    name: "Lyrides",
                    period: "14 avril - 30 avril",
                    peak: "22-04-2026",
                    zhr: 18,
                    visibility: "Visibles en fin de nuit juste avant l'aube."
                },
                {
                    name: "Êta Aquarides",
                    period: "19 avril - 28 mai",
                    peak: "06-05-2026",
                    zhr: 50,
                    visibility: "Conditions optimales dans l'hémisphère Sud et les tropiques."
                },
                {
                    name: "Perséides",
                    period: "17 juillet - 24 août",
                    peak: "12-08-2026",
                    zhr: 100,
                    visibility: "Excellente visibilité durant les nuits d'été."
                },
                {
                    name: "Orionides",
                    period: "2 octobre - 7 novembre",
                    peak: "21-10-2026",
                    zhr: 20,
                    visibility: "Visibles durant la seconde moitié de la nuit."
                },
                {
                    name: "Léonides",
                    period: "6 novembre - 30 novembre",
                    peak: "17-11-2026",
                    zhr: 15,
                    visibility: "Observation recommandée entre minuit et l'aube."
                },
                {
                    name: "Géminides",
                    period: "4 décembre - 20 décembre",
                    peak: "14-12-2026",
                    zhr: 150,
                    visibility: "L'une des plus belles pluies de l'année, très active dès 22h."
                }
            ];

        } catch (error) {
            console.error("Erreur dans MeteorParser :", error.message);
            return [];
        }
    }
};