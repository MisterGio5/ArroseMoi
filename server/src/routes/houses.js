const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// --- Helpers ---

function getUserHouseMembership(userId, houseId) {
  return db.prepare(
    'SELECT * FROM house_members WHERE user_id = ? AND house_id = ?'
  ).get(userId, houseId);
}

function generateCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// --- House CRUD ---

// GET /api/houses — list my houses
router.get('/', (req, res) => {
  const houses = db.prepare(`
    SELECT h.*, hm.role,
      (SELECT COUNT(*) FROM house_members WHERE house_id = h.id) as member_count,
      (SELECT COUNT(*) FROM plants WHERE house_id = h.id) as plant_count
    FROM houses h
    JOIN house_members hm ON hm.house_id = h.id
    WHERE hm.user_id = ?
    ORDER BY h.created_at ASC
  `).all(req.user.id);

  res.json({ houses });
});

// POST /api/houses — create a house
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Le nom est requis' });
  }

  const code = generateCode();

  const result = db.transaction(() => {
    const r = db.prepare(
      'INSERT INTO houses (name, invite_code, created_by) VALUES (?, ?, ?)'
    ).run(name.trim(), code, req.user.id);
    db.prepare(
      'INSERT INTO house_members (house_id, user_id, role) VALUES (?, ?, ?)'
    ).run(r.lastInsertRowid, req.user.id, 'owner');
    return r;
  })();

  const house = db.prepare(`
    SELECT h.*, 'owner' as role,
      1 as member_count,
      0 as plant_count
    FROM houses h WHERE h.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ house });
});

// GET /api/houses/:houseId — house detail with members
router.get('/:houseId', (req, res) => {
  const membership = getUserHouseMembership(req.user.id, req.params.houseId);
  if (!membership) return res.status(403).json({ error: 'Accès refusé' });

  const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(req.params.houseId);
  if (!house) return res.status(404).json({ error: 'Maison non trouvée' });

  const members = db.prepare(`
    SELECT u.id, u.email, hm.role, hm.joined_at
    FROM house_members hm
    JOIN users u ON u.id = hm.user_id
    WHERE hm.house_id = ?
    ORDER BY hm.joined_at ASC
  `).all(req.params.houseId);

  const pendingInvitations = db.prepare(`
    SELECT id, invited_email, status, created_at, expires_at
    FROM house_invitations
    WHERE house_id = ? AND status = 'pending' AND expires_at > datetime('now')
    ORDER BY created_at DESC
  `).all(req.params.houseId);

  res.json({
    house: {
      ...house,
      role: membership.role,
      members,
      pendingInvitations,
    },
  });
});

// PUT /api/houses/:houseId — rename
router.put('/:houseId', (req, res) => {
  const membership = getUserHouseMembership(req.user.id, req.params.houseId);
  if (!membership) return res.status(403).json({ error: 'Accès refusé' });

  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Le nom est requis' });
  }

  db.prepare('UPDATE houses SET name = ? WHERE id = ?').run(name.trim(), req.params.houseId);
  const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(req.params.houseId);

  res.json({ house: { ...house, role: membership.role } });
});

// DELETE /api/houses/:houseId — delete (owner only)
router.delete('/:houseId', (req, res) => {
  const membership = getUserHouseMembership(req.user.id, req.params.houseId);
  if (!membership || membership.role !== 'owner') {
    return res.status(403).json({ error: 'Seul le propriétaire peut supprimer la maison' });
  }

  // Check if this is the user's only house
  const userHouseCount = db.prepare(
    'SELECT COUNT(*) as count FROM house_members WHERE user_id = ?'
  ).get(req.user.id).count;

  if (userHouseCount <= 1) {
    return res.status(400).json({ error: 'Impossible de supprimer ta dernière maison' });
  }

  db.transaction(() => {
    // Nullify house_id on plants (ON DELETE SET NULL handles this, but be explicit)
    db.prepare('UPDATE plants SET house_id = NULL WHERE house_id = ?').run(req.params.houseId);
    db.prepare('DELETE FROM houses WHERE id = ?').run(req.params.houseId);
  })();

  res.json({ message: 'Maison supprimée' });
});

// --- Invitations ---

// POST /api/houses/:houseId/invite — invite by email
router.post('/:houseId/invite', (req, res) => {
  const membership = getUserHouseMembership(req.user.id, req.params.houseId);
  if (!membership) return res.status(403).json({ error: 'Accès refusé' });

  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'L\'email est requis' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if already a member
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existingUser) {
    const existingMember = getUserHouseMembership(existingUser.id, req.params.houseId);
    if (existingMember) {
      return res.status(409).json({ error: 'Cet utilisateur est déjà membre de la maison' });
    }
  }

  // Check for pending invitation
  const pendingInvite = db.prepare(`
    SELECT id FROM house_invitations
    WHERE house_id = ? AND invited_email = ? AND status = 'pending' AND expires_at > datetime('now')
  `).get(req.params.houseId, normalizedEmail);

  if (pendingInvite) {
    return res.status(409).json({ error: 'Une invitation est déjà en attente pour cet email' });
  }

  db.prepare(`
    INSERT INTO house_invitations (house_id, invited_email, invited_by, expires_at)
    VALUES (?, ?, ?, datetime('now', '+7 days'))
  `).run(req.params.houseId, normalizedEmail, req.user.id);

  res.status(201).json({ message: 'Invitation envoyée' });
});

// POST /api/houses/join — join by code
router.post('/join', (req, res) => {
  const { code } = req.body;
  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Le code est requis' });
  }

  const house = db.prepare('SELECT * FROM houses WHERE invite_code = ?').get(code.trim().toUpperCase());
  if (!house) {
    return res.status(404).json({ error: 'Code d\'invitation invalide' });
  }

  const existing = getUserHouseMembership(req.user.id, house.id);
  if (existing) {
    return res.status(409).json({ error: 'Tu es déjà membre de cette maison' });
  }

  db.transaction(() => {
    db.prepare(
      'INSERT INTO house_members (house_id, user_id, role) VALUES (?, ?, ?)'
    ).run(house.id, req.user.id, 'member');

    // Accept any pending invitation for this user's email
    const userEmail = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id)?.email;
    if (userEmail) {
      db.prepare(`
        UPDATE house_invitations SET status = 'accepted'
        WHERE house_id = ? AND invited_email = ? AND status = 'pending'
      `).run(house.id, userEmail.toLowerCase());
    }
  })();

  res.json({ house: { ...house, role: 'member' } });
});

// DELETE /api/houses/:houseId/members/:userId — remove or leave
router.delete('/:houseId/members/:userId', (req, res) => {
  const targetUserId = Number(req.params.userId);
  const membership = getUserHouseMembership(req.user.id, req.params.houseId);
  if (!membership) return res.status(403).json({ error: 'Accès refusé' });

  const isSelf = req.user.id === targetUserId;

  if (!isSelf && membership.role !== 'owner') {
    return res.status(403).json({ error: 'Seul le propriétaire peut retirer un membre' });
  }

  const targetMembership = getUserHouseMembership(targetUserId, req.params.houseId);
  if (!targetMembership) {
    return res.status(404).json({ error: 'Membre non trouvé' });
  }

  // Prevent sole owner from leaving
  if (isSelf && targetMembership.role === 'owner') {
    const ownerCount = db.prepare(
      "SELECT COUNT(*) as count FROM house_members WHERE house_id = ? AND role = 'owner'"
    ).get(req.params.houseId).count;

    if (ownerCount <= 1) {
      return res.status(400).json({
        error: 'Tu es le seul propriétaire. Transfère le rôle ou supprime la maison.',
      });
    }
  }

  db.prepare(
    'DELETE FROM house_members WHERE house_id = ? AND user_id = ?'
  ).run(req.params.houseId, targetUserId);

  res.json({ message: isSelf ? 'Tu as quitté la maison' : 'Membre retiré' });
});

// POST /api/houses/:houseId/regenerate-code — regenerate invite code (owner only)
router.post('/:houseId/regenerate-code', (req, res) => {
  const membership = getUserHouseMembership(req.user.id, req.params.houseId);
  if (!membership || membership.role !== 'owner') {
    return res.status(403).json({ error: 'Seul le propriétaire peut régénérer le code' });
  }

  const newCode = generateCode();
  db.prepare('UPDATE houses SET invite_code = ? WHERE id = ?').run(newCode, req.params.houseId);

  res.json({ invite_code: newCode });
});

// --- Pending invitations for current user ---

// GET /api/houses/invitations/pending
router.get('/invitations/pending', (req, res) => {
  const userEmail = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id)?.email;
  if (!userEmail) return res.json({ invitations: [] });

  const invitations = db.prepare(`
    SELECT hi.*, h.name as house_name, u.email as invited_by_email
    FROM house_invitations hi
    JOIN houses h ON h.id = hi.house_id
    JOIN users u ON u.id = hi.invited_by
    WHERE hi.invited_email = ? AND hi.status = 'pending' AND hi.expires_at > datetime('now')
    ORDER BY hi.created_at DESC
  `).all(userEmail.toLowerCase());

  res.json({ invitations });
});

// POST /api/houses/invitations/:id/accept
router.post('/invitations/:id/accept', (req, res) => {
  const invitation = db.prepare('SELECT * FROM house_invitations WHERE id = ?').get(req.params.id);
  if (!invitation) return res.status(404).json({ error: 'Invitation non trouvée' });

  const userEmail = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id)?.email;
  if (!userEmail || userEmail.toLowerCase() !== invitation.invited_email.toLowerCase()) {
    return res.status(403).json({ error: 'Cette invitation ne t\'est pas destinée' });
  }

  if (invitation.status !== 'pending') {
    return res.status(400).json({ error: 'Cette invitation a déjà été traitée' });
  }

  const existing = getUserHouseMembership(req.user.id, invitation.house_id);
  if (existing) {
    db.prepare("UPDATE house_invitations SET status = 'accepted' WHERE id = ?").run(req.params.id);
    return res.json({ message: 'Tu es déjà membre de cette maison' });
  }

  db.transaction(() => {
    db.prepare(
      'INSERT INTO house_members (house_id, user_id, role) VALUES (?, ?, ?)'
    ).run(invitation.house_id, req.user.id, 'member');
    db.prepare("UPDATE house_invitations SET status = 'accepted' WHERE id = ?").run(req.params.id);
  })();

  const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(invitation.house_id);
  res.json({ message: 'Invitation acceptée', house });
});

// POST /api/houses/invitations/:id/decline
router.post('/invitations/:id/decline', (req, res) => {
  const invitation = db.prepare('SELECT * FROM house_invitations WHERE id = ?').get(req.params.id);
  if (!invitation) return res.status(404).json({ error: 'Invitation non trouvée' });

  const userEmail = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id)?.email;
  if (!userEmail || userEmail.toLowerCase() !== invitation.invited_email.toLowerCase()) {
    return res.status(403).json({ error: 'Cette invitation ne t\'est pas destinée' });
  }

  db.prepare("UPDATE house_invitations SET status = 'declined' WHERE id = ?").run(req.params.id);
  res.json({ message: 'Invitation refusée' });
});

module.exports = router;
