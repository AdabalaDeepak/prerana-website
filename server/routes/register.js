// =============================================================
// POST /api/register
// Anyone visiting the site can call this — it just saves the
// student's details so the admin panel can see them, and returns
// an id we reuse later when creating the Razorpay order.
// =============================================================
const express = require('express');
const crypto = require('crypto');
const { addOne } = require('../dataStore');

const router = express.Router();

router.post('/', (req, res) => {
  const { name, phone, email, course, message, fee } = req.body || {};

  // Basic server-side validation — never trust the browser alone
  if (!name || !phone || !email || !course) {
    return res.status(400).json({ error: 'Name, phone, email and course are required' });
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Phone must be a 10-digit number' });
  }

  const registration = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    phone: String(phone).trim(),
    email: String(email).trim(),
    course: String(course).trim(),
    message: message ? String(message).trim() : '',
    fee: Number(fee) || 0,
    paymentStatus: Number(fee) > 0 ? 'pending' : 'not_required',
    createdAt: new Date().toISOString()
  };

  addOne(registration);

  res.status(201).json({ registrationId: registration.id });
});

module.exports = router;
