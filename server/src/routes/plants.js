const express = require('express');
const multer = require('multer');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { decrypt } = require('../utils/crypto');

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
    toxic: !!plant.toxic,
    houseId: plant.house_id,
    lastWatered: plant.last_watered,
    acquiredDate: plant.acquired_date,
    repottingFrequency: plant.repotting_frequency,
    lastRepotted: plant.last_repotted,
    fertilizerFrequency: plant.fertilizer_frequency,
    lastFertilized: plant.last_fertilized,
    careTips: plant.care_tips ? JSON.parse(plant.care_tips) : [],
    idealTemp: plant.ideal_temp,
  };
}

// Helper: find a plant the user has access to via house membership or ownership
function findAccessiblePlant(plantId, userId) {
  return db.prepare(`
    SELECT p.* FROM plants p
    LEFT JOIN house_members hm ON hm.house_id = p.house_id AND hm.user_id = ?
    WHERE p.id = ? AND (hm.user_id IS NOT NULL OR (p.user_id = ? AND p.house_id IS NULL))
  `).get(userId, plantId, userId);
}

// Helper: check house membership
function getUserHouseMembership(userId, houseId) {
  return db.prepare(
    'SELECT * FROM house_members WHERE user_id = ? AND house_id = ?'
  ).get(userId, houseId);
}

// GET /api/plants
router.get('/', (req, res) => {
  const { houseId } = req.query;

  let plants;
  if (houseId) {
    const membership = getUserHouseMembership(req.user.id, houseId);
    if (!membership) return res.status(403).json({ error: 'Accès refusé' });

    plants = db.prepare('SELECT * FROM plants WHERE house_id = ? ORDER BY created_at DESC').all(houseId);
  } else {
    // All plants from all houses the user belongs to + orphan plants (house_id NULL)
    plants = db.prepare(`
      SELECT p.* FROM plants p
      LEFT JOIN house_members hm ON hm.house_id = p.house_id AND hm.user_id = ?
      WHERE hm.user_id IS NOT NULL OR (p.user_id = ? AND p.house_id IS NULL)
      ORDER BY p.created_at DESC
    `).all(req.user.id, req.user.id);
  }

  res.json({ plants: plants.map(formatPlant) });
});

// GET /api/plants/:id
router.get('/:id', (req, res) => {
  const plant = findAccessiblePlant(req.params.id, req.user.id);
  if (!plant) return res.status(404).json({ error: 'Plante non trouvée' });
  res.json({ plant: formatPlant(plant) });
});

// POST /api/plants
router.post('/', (req, res) => {
  const { name, type, sun, room, frequency, lastWatered, notes, photo, indoor, acquiredDate, houseId } = req.body;

  if (!name) return res.status(400).json({ error: 'Le nom est requis' });

  // If houseId provided, verify membership. Otherwise use user's first house.
  let targetHouseId = houseId;
  if (targetHouseId) {
    const membership = getUserHouseMembership(req.user.id, targetHouseId);
    if (!membership) return res.status(403).json({ error: 'Accès refusé à cette maison' });
  } else {
    const firstHouse = db.prepare(`
      SELECT h.id FROM houses h
      JOIN house_members hm ON hm.house_id = h.id
      WHERE hm.user_id = ?
      ORDER BY h.created_at ASC LIMIT 1
    `).get(req.user.id);
    targetHouseId = firstHouse?.id || null;
  }

  const result = db.prepare(`
    INSERT INTO plants (user_id, house_id, name, type, sun, room, frequency, last_watered, notes, photo, indoor, acquired_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, targetHouseId, name, type, sun, room, frequency || 7, lastWatered || new Date().toISOString(), notes, photo, indoor ? 1 : 0, acquiredDate || null);

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ plant: formatPlant(plant) });
});

// PUT /api/plants/:id
router.put('/:id', (req, res) => {
  const existing = findAccessiblePlant(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Plante non trouvée' });

  const {
    name, type, sun, room, frequency, lastWatered, notes, photo, indoor,
    acquiredDate, repottingFrequency, lastRepotted, fertilizerFrequency, lastFertilized,
    careTips, difficulty, idealTemp, humidity, toxic, houseId,
  } = req.body;

  // If changing house, verify membership in new house
  let targetHouseId = existing.house_id;
  if (houseId && houseId !== existing.house_id) {
    const membership = getUserHouseMembership(req.user.id, houseId);
    if (!membership) return res.status(403).json({ error: 'Accès refusé à cette maison' });
    targetHouseId = houseId;
  }

  db.prepare(`
    UPDATE plants SET
      name = ?, type = ?, sun = ?, room = ?, frequency = ?, last_watered = ?,
      notes = ?, photo = ?, indoor = ?,
      acquired_date = ?, repotting_frequency = ?, last_repotted = ?,
      fertilizer_frequency = ?, last_fertilized = ?,
      care_tips = ?, difficulty = ?, ideal_temp = ?, humidity = ?, toxic = ?,
      house_id = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name, type, sun, room, frequency, lastWatered,
    notes, photo, indoor ? 1 : 0,
    acquiredDate || existing.acquired_date,
    repottingFrequency ?? existing.repotting_frequency,
    lastRepotted || existing.last_repotted,
    fertilizerFrequency ?? existing.fertilizer_frequency,
    lastFertilized || existing.last_fertilized,
    careTips ? JSON.stringify(careTips) : existing.care_tips,
    difficulty || existing.difficulty,
    idealTemp || existing.ideal_temp,
    humidity || existing.humidity,
    toxic !== undefined ? (toxic ? 1 : 0) : existing.toxic,
    targetHouseId,
    req.params.id
  );

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id);
  res.json({ plant: formatPlant(plant) });
});

// DELETE /api/plants/:id
router.delete('/:id', (req, res) => {
  const existing = findAccessiblePlant(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Plante non trouvée' });

  db.prepare('DELETE FROM plants WHERE id = ?').run(req.params.id);
  res.json({ message: 'Plante supprimée' });
});

// PATCH /api/plants/:id/water
router.patch('/:id/water', (req, res) => {
  const existing = findAccessiblePlant(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Plante non trouvée' });

  db.prepare('UPDATE plants SET last_watered = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(new Date().toISOString(), req.params.id);

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id);
  res.json({ plant: formatPlant(plant) });
});

// PATCH /api/plants/:id/favorite
router.patch('/:id/favorite', (req, res) => {
  const existing = findAccessiblePlant(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Plante non trouvée' });

  db.prepare('UPDATE plants SET favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(existing.favorite ? 0 : 1, req.params.id);

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id);
  res.json({ plant: formatPlant(plant) });
});

// POST /api/plants/:id/ai-care
router.post('/:id/ai-care', async (req, res) => {
  try {
    const plant = findAccessiblePlant(req.params.id, req.user.id);
    if (!plant) return res.status(404).json({ error: 'Plante non trouvée' });

    const openaiKey = decrypt(db.prepare('SELECT openai_api_key FROM users WHERE id = ?').get(req.user.id)?.openai_api_key);
    if (!openaiKey) {
      return res.status(400).json({ error: 'Configure ta clé OpenAI dans ton profil pour utiliser l\'IA.' });
    }

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Tu es un expert en botanique. Pour la plante "${plant.name}" (type: ${plant.type || 'non précisé'}, exposition: ${plant.sun || 'non précisé'}), donne-moi une fiche d'entretien complète.

Réponds UNIQUEMENT avec un JSON valide:
{
  "care_tips": ["conseil 1", "conseil 2", "conseil 3", "conseil 4", "conseil 5"],
  "repotting_frequency": nombre_en_mois,
  "fertilizer_frequency": nombre_en_semaines,
  "difficulty": "facile|moyen|difficile",
  "ideal_temp": "XX-XX°C",
  "humidity": "faible|moyenne|élevée",
  "toxic": true ou false (toxique pour chats/chiens),
  "watering_frequency": nombre_jours
}`,
        }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      return res.status(502).json({ error: 'Erreur lors de l\'appel à l\'IA. Vérifie ta clé OpenAI.' });
    }

    const aiData = await aiResponse.json();
    const parsed = JSON.parse(aiData.choices[0].message.content);

    db.prepare(`
      UPDATE plants SET
        care_tips = ?, repotting_frequency = ?, fertilizer_frequency = ?,
        difficulty = ?, ideal_temp = ?, humidity = ?, toxic = ?,
        frequency = COALESCE(?, frequency),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      JSON.stringify(parsed.care_tips || []),
      parsed.repotting_frequency || null,
      parsed.fertilizer_frequency || null,
      parsed.difficulty || null,
      parsed.ideal_temp || null,
      parsed.humidity || null,
      parsed.toxic ? 1 : 0,
      parsed.watering_frequency || null,
      req.params.id
    );

    const updatedPlant = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id);
    res.json({ plant: formatPlant(updatedPlant) });
  } catch (err) {
    console.error('AI care error:', err);
    res.status(500).json({ error: 'Erreur lors de la génération des conseils IA' });
  }
});

// POST /api/plants/identify
router.post('/identify', upload.array('images[]', 5), async (req, res) => {
  try {
    const user = db.prepare('SELECT plantnet_api_key FROM users WHERE id = ?').get(req.user.id);
    const plantnetKey = decrypt(user?.plantnet_api_key);

    if (!plantnetKey) {
      return res.json({
        warning: 'Configure ta clé PlantNet dans ton profil pour identifier les plantes.',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    const formData = new FormData();
    for (const file of req.files) {
      formData.append('images', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    }
    formData.append('organs', 'auto');

    const response = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${plantnetKey}&lang=fr`,
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

    const openaiKey = decrypt(db.prepare('SELECT openai_api_key FROM users WHERE id = ?').get(req.user.id)?.openai_api_key);
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
