const express = require('express');
const multer = require('multer');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// All plant routes require authentication
router.use(authenticate);

// Helper to format plant for response
function formatPlant(plant) {
  return {
    ...plant,
    indoor: !!plant.indoor,
    favorite: !!plant.favorite,
    lastWatered: plant.last_watered,
  };
}

// GET /api/plants
router.get('/', (req, res) => {
  const plants = db.prepare('SELECT * FROM plants WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ plants: plants.map(formatPlant) });
});

// GET /api/plants/:id
router.get('/:id', (req, res) => {
  const plant = db.prepare('SELECT * FROM plants WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!plant) return res.status(404).json({ error: 'Plante non trouvée' });
  res.json({ plant: formatPlant(plant) });
});

// POST /api/plants
router.post('/', (req, res) => {
  const { name, type, sun, room, frequency, lastWatered, notes, photo, indoor } = req.body;

  if (!name) return res.status(400).json({ error: 'Le nom est requis' });

  const result = db.prepare(`
    INSERT INTO plants (user_id, name, type, sun, room, frequency, last_watered, notes, photo, indoor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, name, type, sun, room, frequency || 7, lastWatered || new Date().toISOString(), notes, photo, indoor ? 1 : 0);

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ plant: formatPlant(plant) });
});

// PUT /api/plants/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM plants WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Plante non trouvée' });

  const { name, type, sun, room, frequency, lastWatered, notes, photo, indoor } = req.body;

  db.prepare(`
    UPDATE plants SET name = ?, type = ?, sun = ?, room = ?, frequency = ?, last_watered = ?, notes = ?, photo = ?, indoor = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(name, type, sun, room, frequency, lastWatered, notes, photo, indoor ? 1 : 0, req.params.id, req.user.id);

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id);
  res.json({ plant: formatPlant(plant) });
});

// DELETE /api/plants/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM plants WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Plante non trouvée' });
  res.json({ message: 'Plante supprimée' });
});

// PATCH /api/plants/:id/water
router.patch('/:id/water', (req, res) => {
  const existing = db.prepare('SELECT * FROM plants WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Plante non trouvée' });

  db.prepare('UPDATE plants SET last_watered = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(new Date().toISOString(), req.params.id);

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id);
  res.json({ plant: formatPlant(plant) });
});

// PATCH /api/plants/:id/favorite
router.patch('/:id/favorite', (req, res) => {
  const existing = db.prepare('SELECT * FROM plants WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Plante non trouvée' });

  db.prepare('UPDATE plants SET favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(existing.favorite ? 0 : 1, req.params.id);

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id);
  res.json({ plant: formatPlant(plant) });
});

// POST /api/plants/identify
router.post('/identify', upload.array('images[]', 5), async (req, res) => {
  try {
    // Check if user has PlantNet API key
    const user = db.prepare('SELECT plantnet_api_key FROM users WHERE id = ?').get(req.user.id);

    if (!user?.plantnet_api_key) {
      return res.json({
        warning: 'Configure ta clé PlantNet dans ton profil pour identifier les plantes.',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    // Call PlantNet API
    const formData = new FormData();
    for (const file of req.files) {
      formData.append('images', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    }
    formData.append('organs', 'auto');

    const response = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${user.plantnet_api_key}&lang=fr`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      return res.json({ warning: 'Impossible d\'identifier la plante. Vérifie ta clé PlantNet.' });
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return res.json({ warning: 'Aucune plante reconnue dans cette image.' });
    }

    const bestMatch = data.results[0];
    const commonName = bestMatch.species?.commonNames?.[0] || bestMatch.species?.scientificNameWithoutAuthor || 'Plante inconnue';

    // Try to get care tips from OpenAI if key is available
    const openaiKey = db.prepare('SELECT openai_api_key FROM users WHERE id = ?').get(req.user.id)?.openai_api_key;
    let careTips = [];

    if (openaiKey) {
      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: `Donne 3 conseils courts d'entretien pour la plante "${commonName}". Réponds en français avec un JSON: {"tips": ["conseil1", "conseil2", "conseil3"], "frequency": nombre_jours_arrosage, "sun": "ombre|mi-ombre|lumineux|soleil", "type": "interieur|exterieur|aromatique|succulente|potager|fleur|arbre"}`,
            }],
            response_format: { type: 'json_object' },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const parsed = JSON.parse(aiData.choices[0].message.content);
          careTips = parsed.tips || [];

          return res.json({
            confidence: bestMatch.score,
            prefill: {
              name: commonName,
              type: parsed.type || 'interieur',
              sun: parsed.sun || 'lumineux',
              frequency: parsed.frequency || 7,
              notes: `Identifié: ${bestMatch.species?.scientificNameWithoutAuthor || ''}`,
              care_tips: careTips,
            },
          });
        }
      } catch {
        // OpenAI failed, continue without tips
      }
    }

    res.json({
      confidence: bestMatch.score,
      prefill: {
        name: commonName,
        notes: `Identifié: ${bestMatch.species?.scientificNameWithoutAuthor || ''}`,
        care_tips: careTips,
      },
    });
  } catch (err) {
    console.error('Identify error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'identification' });
  }
});

module.exports = router;
