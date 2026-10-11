const path = require('path');
const fs = require('fs');

/**
 * POST /api/upload
 * Upload jusqu'à 10 images
 * Retourne les URLs relatives
 */
function uploadImages(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucune image envoyée' });
    }

    if (req.files.length > 10) {
      // Supprimer les fichiers en trop
      req.files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (e) {}
      });
      return res.status(400).json({ error: 'Maximum 10 images autorisées' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const urls = req.files.map(f => `${baseUrl}/uploads/${f.filename}`);

    res.status(201).json({
      message: `${urls.length} image(s) uploadée(s)`,
      images: urls,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
}

module.exports = { uploadImages };
