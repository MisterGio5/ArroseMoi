const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'app.sqlite');

// Ensure directory exists
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    openai_api_key TEXT,
    plantnet_api_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    sun TEXT,
    room TEXT,
    frequency INTEGER DEFAULT 7,
    last_watered DATETIME,
    notes TEXT,
    photo TEXT,
    indoor INTEGER DEFAULT 0,
    favorite INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Migrate: add plant care columns if missing
function migratePlantColumns() {
  const columns = db.prepare("PRAGMA table_info(plants)").all().map(c => c.name);
  const newColumns = [
    ['acquired_date', 'TEXT'],
    ['repotting_frequency', 'INTEGER'],
    ['last_repotted', 'TEXT'],
    ['fertilizer_frequency', 'INTEGER'],
    ['last_fertilized', 'TEXT'],
    ['care_tips', 'TEXT'],
    ['difficulty', 'TEXT'],
    ['ideal_temp', 'TEXT'],
    ['humidity', 'TEXT'],
    ['toxic', 'INTEGER DEFAULT 0'],
  ];
  for (const [name, type] of newColumns) {
    if (!columns.includes(name)) {
      db.exec(`ALTER TABLE plants ADD COLUMN ${name} ${type}`);
    }
  }
}
migratePlantColumns();

// Migrate plain-text API keys to encrypted format on startup
function migrateApiKeys() {
  try {
    const { encrypt, isEncrypted } = require('../utils/crypto');
    const users = db.prepare('SELECT id, openai_api_key, plantnet_api_key FROM users').all();
    const update = db.prepare('UPDATE users SET openai_api_key = ?, plantnet_api_key = ? WHERE id = ?');

    let migrated = 0;
    for (const user of users) {
      let changed = false;
      let openai = user.openai_api_key;
      let plantnet = user.plantnet_api_key;

      if (openai && !isEncrypted(openai)) {
        openai = encrypt(openai);
        changed = true;
      }
      if (plantnet && !isEncrypted(plantnet)) {
        plantnet = encrypt(plantnet);
        changed = true;
      }
      if (changed) {
        update.run(openai, plantnet, user.id);
        migrated++;
      }
    }
    if (migrated > 0) {
      console.log(`Migrated ${migrated} user(s) API keys to encrypted format`);
    }
  } catch (err) {
    console.error('API key migration skipped:', err.message);
  }
}

migrateApiKeys();

// --- Houses tables ---
db.exec(`
  CREATE TABLE IF NOT EXISTS houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS house_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(house_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS house_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER NOT NULL,
    invited_email TEXT NOT NULL,
    invited_by INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Migrate: add house_id column to plants
function migrateHouseColumn() {
  const columns = db.prepare("PRAGMA table_info(plants)").all().map(c => c.name);
  if (!columns.includes('house_id')) {
    db.exec('ALTER TABLE plants ADD COLUMN house_id INTEGER REFERENCES houses(id) ON DELETE SET NULL');
  }
}
migrateHouseColumn();

// Migrate existing plants into default houses
function migrateExistingPlantsToDefaultHouse() {
  const crypto = require('crypto');

  const usersWithPlants = db.prepare(`
    SELECT DISTINCT p.user_id
    FROM plants p
    LEFT JOIN house_members hm ON hm.user_id = p.user_id
    WHERE hm.id IS NULL
  `).all();

  if (usersWithPlants.length === 0) return;

  const insertHouse = db.prepare(
    'INSERT INTO houses (name, invite_code, created_by) VALUES (?, ?, ?)'
  );
  const insertMember = db.prepare(
    'INSERT INTO house_members (house_id, user_id, role) VALUES (?, ?, ?)'
  );
  const updatePlants = db.prepare(
    'UPDATE plants SET house_id = ? WHERE user_id = ? AND house_id IS NULL'
  );

  const migrate = db.transaction(() => {
    for (const { user_id } of usersWithPlants) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const result = insertHouse.run('Ma Maison', code, user_id);
      insertMember.run(result.lastInsertRowid, user_id, 'owner');
      updatePlants.run(result.lastInsertRowid, user_id);
    }
  });

  migrate();
  console.log(`Migrated ${usersWithPlants.length} user(s) to default houses`);
}
migrateExistingPlantsToDefaultHouse();

module.exports = db;
