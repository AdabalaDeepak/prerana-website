// =============================================================
// Admin API:
//   POST /api/admin/login          — check username/password, return a token
//   GET  /api/admin/registrations  — list all registrations (token required)
// =============================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readAll } = require('../dataStore');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (username !== process.env.ADMIN_USERNAME) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const matches = await bcrypt.compare(password || '', process.env.ADMIN_PASSWORD_HASH || '');
  if (!matches) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

router.get('/registrations', requireAdmin, (req, res) => {
  const records = readAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ records });
});

module.exports = router;
