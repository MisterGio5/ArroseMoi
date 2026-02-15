const db = require('../db/database');
const { webpush } = require('../utils/vapid');
const { addDays, addMonths, parseISO } = require('date-fns');

// Check interval: every 30 minutes
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

// Hour to send notifications (24h format, server timezone)
const NOTIFY_HOUR = 8;

function isDuePlant(plant) {
  if (!plant.last_watered) return true;
  const lastWatered = parseISO(plant.last_watered);
  const nextDate = addDays(lastWatered, plant.frequency || 7);
  const today = new Date();
  today.setHours(8, 0, 0, 0);
  nextDate.setHours(8, 0, 0, 0);
  return nextDate <= today;
}

function isRepottingDue(plant) {
  if (!plant.last_repotted || !plant.repotting_frequency) return false;
  const lastRepotted = parseISO(plant.last_repotted);
  const nextDate = addMonths(lastRepotted, plant.repotting_frequency);
  const today = new Date();
  today.setHours(8, 0, 0, 0);
  nextDate.setHours(8, 0, 0, 0);
  return nextDate <= today;
}

function isFertilizerDue(plant) {
  if (!plant.last_fertilized || !plant.fertilizer_frequency) return false;
  const lastFertilized = parseISO(plant.last_fertilized);
  const nextDate = addDays(lastFertilized, plant.fertilizer_frequency * 7);
  const today = new Date();
  today.setHours(8, 0, 0, 0);
  nextDate.setHours(8, 0, 0, 0);
  return nextDate <= today;
}

function checkAndNotify() {
  const now = new Date();
  const currentHour = now.getHours();

  // Only send between NOTIFY_HOUR and NOTIFY_HOUR+1
  if (currentHour < NOTIFY_HOUR || currentHour > NOTIFY_HOUR) return;

  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

  // Get all users with push subscriptions not yet notified today
  const subscriptions = db.prepare(`
    SELECT ps.*, u.id as uid
    FROM push_subscriptions ps
    JOIN users u ON u.id = ps.user_id
    WHERE ps.last_notified IS NULL OR ps.last_notified < ?
  `).all(today);

  if (subscriptions.length === 0) return;

  // Group subscriptions by user
  const byUser = {};
  for (const sub of subscriptions) {
    if (!byUser[sub.user_id]) byUser[sub.user_id] = [];
    byUser[sub.user_id].push(sub);
  }

  for (const [userId, userSubs] of Object.entries(byUser)) {
    // Get user's plants (across all their houses)
    const plants = db.prepare(`
      SELECT p.* FROM plants p
      JOIN house_members hm ON hm.house_id = p.house_id
      WHERE hm.user_id = ?
    `).all(userId);

    const dueWatering = plants.filter(isDuePlant);
    const dueRepotting = plants.filter(isRepottingDue);
    const dueFertilizer = plants.filter(isFertilizerDue);

    const totalDue = dueWatering.length + dueRepotting.length + dueFertilizer.length;
    if (totalDue === 0) continue;

    const parts = [];
    if (dueWatering.length > 0) parts.push(`${dueWatering.length} a arroser`);
    if (dueRepotting.length > 0) parts.push(`${dueRepotting.length} a rempoter`);
    if (dueFertilizer.length > 0) parts.push(`${dueFertilizer.length} a fertiliser`);

    const payload = JSON.stringify({
      title: `${totalDue} plante(s) ont besoin de toi`,
      body: parts.join(' \u2022 '),
      tag: 'arrosemoi-daily',
      url: '/reminders',
    });

    for (const sub of userSubs) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      webpush.sendNotification(pushSubscription, payload)
        .then(() => {
          db.prepare('UPDATE push_subscriptions SET last_notified = ? WHERE id = ?')
            .run(today, sub.id);
        })
        .catch((err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
            console.log(`Removed expired subscription ${sub.id}`);
          } else {
            console.error(`Push failed for sub ${sub.id}:`, err.message);
          }
        });
    }
  }
}

function startScheduler() {
  console.log('Notification scheduler started (check every 30min)');
  // Run immediately on startup, then every CHECK_INTERVAL_MS
  checkAndNotify();
  setInterval(checkAndNotify, CHECK_INTERVAL_MS);
}

module.exports = { startScheduler };
