const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { webpush, publicKey } = require('../utils/vapid');

// Get VAPID public key (no auth needed)
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey });
});

// Subscribe to push notifications
router.post('/subscribe', authenticate, (req, res) => {
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Subscription invalide' });
  }

  try {
    // Upsert: delete old subscription for same endpoint, then insert
    db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
    db.prepare(
      'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, endpoint, keys.p256dh, keys.auth);

    res.json({ message: 'Souscription enregistrée' });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
});

// Unsubscribe from push notifications
router.delete('/subscribe', authenticate, (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint manquant' });
  }

  try {
    db.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?')
      .run(req.user.id, endpoint);
    res.json({ message: 'Souscription supprimée' });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Send a test notification
router.post('/test', authenticate, (req, res) => {
  const subscriptions = db.prepare(
    'SELECT * FROM push_subscriptions WHERE user_id = ?'
  ).all(req.user.id);

  if (subscriptions.length === 0) {
    return res.status(404).json({ error: 'Aucune souscription trouvée' });
  }

  const payload = JSON.stringify({
    title: 'ArroseMoi',
    body: 'Les notifications fonctionnent ! Vous recevrez des rappels d\'arrosage.',
    tag: 'arrosemoi-test',
    url: '/',
  });

  const results = subscriptions.map((sub) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    return webpush.sendNotification(pushSubscription, payload).catch((err) => {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired - clean up
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
      }
      return { error: err.message };
    });
  });

  Promise.all(results)
    .then(() => res.json({ message: 'Notification test envoyée' }))
    .catch(() => res.status(500).json({ error: 'Erreur lors de l\'envoi' }));
});

module.exports = router;
