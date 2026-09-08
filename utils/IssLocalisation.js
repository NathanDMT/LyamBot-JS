const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_KEY = process.env.GEOAPIFY_API_KEY || 'a44b2f32de914092ab364d84ae40215c';

router.get('/map', async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon || lat === 'N/A' || lon === 'N/A') {
        return res.status(400).send('Paramètres lat et lon valides requis.');
    }

    try {
        // Utilisation d'un format de marqueur standard supporté par Geoapify sans caractères spéciaux conflictuels
        const markerParam = `lonlat:${lon},${lat};type:awesome;color:red;size:large`;

        const params = new URLSearchParams({
            style: 'dark-matter',
            center: `lonlat:${lon},${lat}`,
            zoom: '3',
            width: '600',
            height: '300',
            marker: markerParam,
            apiKey: API_KEY
        });

        const imageUrl = `https://maps.geoapify.com/v1/staticmap?${params.toString()}`;

        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer'
        });

        res.setHeader('Content-Type', 'image/png');
        res.send(response.data);
    } catch (error) {
        console.error('Erreur Geoapify :', error.response?.data?.toString() || error.message);
        res.status(500).send('Erreur lors de la récupération de l\'image');
    }
});

module.exports = router;