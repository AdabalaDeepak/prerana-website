// =============================================================
// Very small file-based data store.
// Registrations are kept in server/data/registrations.json as a
// plain JSON array — open it in any text editor to inspect it.
//
// This is intentionally simple so it's easy to read and edit by
// hand while you're getting started. If your registration volume
// grows, swap this file for a real database (e.g. MongoDB/Postgres)
// without needing to change the route files much — just keep the
// same function names (readAll, addOne, updateOne).
// =============================================================
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'registrations.json');

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  }
}

function readAll() {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(records) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

function addOne(record) {
  const records = readAll();
  records.push(record);
  writeAll(records);
  return record;
}

function updateOne(id, updates) {
  const records = readAll();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...updates };
  writeAll(records);
  return records[idx];
}

function findOne(id) {
  return readAll().find(r => r.id === id) || null;
}

module.exports = { readAll, addOne, updateOne, findOne };
