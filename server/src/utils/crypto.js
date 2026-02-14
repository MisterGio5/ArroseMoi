const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  // Derive a 32-byte key from the provided secret
  return crypto.scryptSync(key, 'arrosemoi-salt', 32);
}

function encrypt(plaintext) {
  if (!plaintext) return null;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decrypt(encryptedText) {
  if (!encryptedText) return null;

  // If the value doesn't match our encrypted format, it's a legacy plain-text key
  if (!encryptedText.includes(':')) {
    return encryptedText;
  }

  const key = getEncryptionKey();
  const parts = encryptedText.split(':');
  if (parts.length !== 3) return encryptedText;

  try {
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = Buffer.from(parts[2], 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch {
    // Decryption failed — likely a plain-text key containing ':'
    return encryptedText;
  }
}

function isEncrypted(value) {
  if (!value || !value.includes(':')) return false;
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  try {
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

module.exports = { encrypt, decrypt, isEncrypted };
