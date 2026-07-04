// =============================================================
// PRERANA DEFENCE ACADEMY — backend server
// Run with: npm install   then   npm start
// Serves the frontend (public/) and admin panel (admin/), and
// exposes the /api routes used by both.
// =============================================================
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const registerRoutes = require('./routes/register');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

// ---- Security / basics ----
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true, // during local dev, allow all
}));
app.use(express.json());

// ---- Static frontend + admin panel ----
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// ---- API routes ----
app.use('/api/register', registerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// ---- Health check (useful once deployed) ----
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Prerana Defence Academy server running at http://localhost:${PORT}`);
});
