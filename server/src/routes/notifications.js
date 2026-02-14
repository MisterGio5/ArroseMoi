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

    console.log(`[Push] Subscription saved for user ${req.user.id}, endpoint: ${endpoint.slice(0, 60)}...`);
    res.json({ message: 'Souscription enregistrée' });
  } catch (err) {
    console.error('[Push] Subscribe error:', err);
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
    console.error('[Push] Unsubscribe error:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Send a test notification
router.post('/test', authenticate, async (req, res) => {
  try {
    const subscriptions = db.prepare(
      'SELECT * FROM push_subscriptions WHERE user_id = ?'
    ).all(req.user.id);

    console.log(`[Push] Test requested by user ${req.user.id}, found ${subscriptions.length} subscription(s)`);

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Aucune souscription trouvée. Réactivez les notifications.' });
    }

    const payload = JSON.stringify({
      title: 'ArroseMoi',
      body: 'Les notifications fonctionnent ! Vous recevrez des rappels d\'arrosage.',
      tag: 'arrosemoi-test',
      url: '/',
    });

    let sent = 0;
    const errors = [];

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
        console.log(`[Push] Notification sent to sub ${sub.id}`);
      } catch (err) {
        console.error(`[Push] Failed for sub ${sub.id}:`, err.statusCode, err.body || err.message);
        errors.push(`Sub ${sub.id}: ${err.statusCode} - ${err.body || err.message}`);

        if (err.statusCode === 410 || err.statusCode === 404) {
          db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
          console.log(`[Push] Removed expired subscription ${sub.id}`);
        }
      }
    }

    if (sent > 0) {
      res.json({ message: `Notification envoyée (${sent}/${subscriptions.length})` });
    } else {
      res.status(500).json({
        error: 'Échec de l\'envoi. Les souscriptions sont peut-être expirées. Désactivez puis réactivez les notifications.',
        details: errors,
      });
    }
  } catch (err) {
    console.error('[Push] Test error:', err);
    res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
});

module.exports = router;
