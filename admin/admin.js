// =============================================================
// Admin panel behaviour. Same API_BASE logic as the main site's
// js/main.js — change it once you deploy the backend elsewhere.
// =============================================================
const API_BASE = window.location.origin.includes('localhost')
  ? 'http://localhost:4000'
  : '';

const TOKEN_KEY = 'pda_admin_token';

// ---------------- Login page ----------------
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = '';

    const data = Object.fromEntries(new FormData(loginForm).entries());

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const body = await res.json();
      if (!res.ok) {
        errorEl.textContent = body.error || 'Login failed';
        return;
      }
      localStorage.setItem(TOKEN_KEY, body.token);
      window.location.href = 'dashboard.html';
    } catch {
      errorEl.textContent = 'Could not reach the server. Is it running?';
    }
  });
}

// ---------------- Dashboard page ----------------
const regBody = document.getElementById('regBody');
if (regBody) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    window.location.href = 'login.html';
  } else {
    loadRegistrations();
  }

  document.getElementById('refreshBtn').addEventListener('click', loadRegistrations);
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = 'login.html';
  });

  async function loadRegistrations() {
    regBody.innerHTML = '<tr><td colspan="8">Loading…</td></tr>';
    try {
      const res = await fetch(`${API_BASE}/api/admin/registrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = 'login.html';
        return;
      }
      const { records } = await res.json();
      renderSummary(records);
      renderTable(records);
    } catch {
      regBody.innerHTML = '<tr><td colspan="8">Could not load registrations.</td></tr>';
    }
  }

  function renderSummary(records) {
    const total = records.length;
    const paid = records.filter(r => r.paymentStatus === 'paid').length;
    const pending = records.filter(r => r.paymentStatus === 'pending').length;
    document.getElementById('summary').innerHTML = `
      <div class="card"><b>${total}</b><span>Total Registrations</span></div>
      <div class="card"><b>${paid}</b><span>Paid</span></div>
      <div class="card"><b>${pending}</b><span>Payment Pending</span></div>
    `;
  }

  function renderTable(records) {
    if (!records.length) {
      regBody.innerHTML = '<tr><td colspan="8">No registrations yet.</td></tr>';
      return;
    }
    regBody.innerHTML = records.map(r => `
      <tr>
        <td>${new Date(r.createdAt).toLocaleString('en-IN')}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.phone)}</td>
        <td>${escapeHtml(r.email)}</td>
        <td>${escapeHtml(r.course)}</td>
        <td>${r.fee ? '₹' + r.fee : '—'}</td>
        <td>${paymentBadge(r.paymentStatus)}</td>
        <td>${escapeHtml(r.message || '—')}</td>
      </tr>
    `).join('');
  }

  function paymentBadge(status) {
    if (status === 'paid') return '<span class="badge badge-paid">Paid</span>';
    if (status === 'pending') return '<span class="badge badge-pending">Pending</span>';
    return '<span class="badge badge-none">N/A</span>';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }
}
