// =============================================================
// Handles the two server-side steps of Razorpay checkout:
//   1. POST /api/payment/create-order   — before opening the widget
//   2. POST /api/payment/verify         — after the student pays
//
// The RAZORPAY_KEY_SECRET is only ever used here, on the server.
// It must never appear in any file inside /public.
// =============================================================
const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { findOne, updateOne } = require('../dataStore');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ---- 1. Create an order ----
router.post('/create-order', async (req, res) => {
  const { registrationId, amountRupees } = req.body || {};

  const registration = findOne(registrationId);
  if (!registration) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  const amountPaise = Math.round(Number(amountRupees) * 100);
  if (!amountPaise || amountPaise <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `reg_${registration.id}`,
      notes: { registrationId: registration.id, course: registration.course }
    });

    updateOne(registration.id, { razorpayOrderId: order.id });

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID // public key id — safe to send to the browser
    });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    res.status(500).json({ error: 'Could not create payment order' });
  }
});

// ---- 2. Verify payment after checkout completes ----
router.post('/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  // Recompute the expected signature ourselves — this is the step that
  // actually proves the payment is genuine and wasn't tampered with.
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const verified = expectedSignature === razorpay_signature;

  if (verified && registrationId) {
    updateOne(registrationId, {
      paymentStatus: 'paid',
      razorpayPaymentId: razorpay_payment_id,
      paidAt: new Date().toISOString()
    });
  }

  res.json({ verified });
});

module.exports = router;
