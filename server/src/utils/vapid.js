const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const VAPID_PATH = process.env.VAPID_KEYS_PATH || path.join(process.env.DATABASE_PATH ? path.dirname(process.env.DATABASE_PATH) : path.join(__dirname, '..', '..', 'data'), 'vapid-keys.json');

function getVapidKeys() {
  // Try to load existing keys
  if (fs.existsSync(VAPID_PATH)) {
    const data = JSON.parse(fs.readFileSync(VAPID_PATH, 'utf-8'));
    return data;
  }

  // Generate new keys
  const keys = webpush.generateVAPIDKeys();
  const data = {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  };

  // Persist keys
  fs.mkdirSync(path.dirname(VAPID_PATH), { recursive: true });
  fs.writeFileSync(VAPID_PATH, JSON.stringify(data, null, 2));
  console.log('Generated new VAPID keys');

  return data;
}

// Initialize web-push with VAPID keys
const vapidKeys = getVapidKeys();
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:arrosemoi@example.com';

webpush.setVapidDetails(VAPID_SUBJECT, vapidKeys.publicKey, vapidKeys.privateKey);

module.exports = {
  webpush,
  publicKey: vapidKeys.publicKey,
};
