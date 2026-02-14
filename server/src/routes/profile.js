const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/crypto');

const router = express.Router();

router.use(authenticate);

// Mask API key for display (show first 4 and last 4 chars)
function maskKey(encryptedKey) {
  const key = decrypt(encryptedKey);
  if (!key) return null;
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

// GET /api/profile
router.get('/', (req, res) => {
  const user = db.prepare('SELECT openai_api_key, plantnet_api_key FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

  res.json({
    openaiApiKey: maskKey(user.openai_api_key),
    plantnetApiKey: maskKey(user.plantnet_api_key),
  });
});

// PUT /api/profile/api-keys
router.put('/api-keys', (req, res) => {
  const { openaiApiKey, plantnetApiKey } = req.body;

  if (openaiApiKey !== null && openaiApiKey !== undefined) {
    db.prepare('UPDATE users SET openai_api_key = ? WHERE id = ?').run(encrypt(openaiApiKey), req.user.id);
  }
  if (plantnetApiKey !== null && plantnetApiKey !== undefined) {
    db.prepare('UPDATE users SET plantnet_api_key = ? WHERE id = ?').run(encrypt(plantnetApiKey), req.user.id);
  }

  res.json({ message: 'Clés API mises à jour' });
});

// DELETE /api/profile/api-keys
router.delete('/api-keys', (req, res) => {
  const { keyType } = req.body;

  if (keyType === 'openai') {
    db.prepare('UPDATE users SET openai_api_key = NULL WHERE id = ?').run(req.user.id);
  } else if (keyType === 'plantnet') {
    db.prepare('UPDATE users SET plantnet_api_key = NULL WHERE id = ?').run(req.user.id);
  } else {
    return res.status(400).json({ error: 'Type de clé invalide' });
  }

  res.json({ message: 'Clé supprimée' });
});

module.exports = router;
