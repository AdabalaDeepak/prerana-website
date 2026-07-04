# Prerana Defence Academy — Website

A plain HTML/CSS/JS landing page, a small Node.js backend for registrations,
an admin dashboard, and Razorpay payment integration.

Everything is written in plain, commented code on purpose — no build step,
no framework magic — so you (or anyone else) can open a file and understand
what it does.

## What's inside

```
prerana-website/
├── public/              ← the landing page students see
│   ├── index.html          all page content — edit text/courses directly here
│   ├── css/style.css       colors, fonts, layout — edit the :root variables to retheme
│   └── js/main.js          form handling + Razorpay checkout
│
├── admin/               ← password-protected dashboard for you
│   ├── login.html
│   ├── dashboard.html      lists every registration
│   ├── admin.css
│   └── admin.js
│
├── server/              ← the backend (Node.js + Express)
│   ├── server.js           starts everything
│   ├── dataStore.js        reads/writes registrations.json
│   ├── data/registrations.json   ← your registrations live here as plain JSON
│   ├── routes/register.js  saves new registrations
│   ├── routes/payment.js   creates & verifies Razorpay payments
│   ├── routes/admin.js     admin login + list registrations
│   └── middleware/auth.js  protects admin routes
│
├── .env.example         ← copy to .env and fill in your real keys
├── package.json
└── README.md             (this file)
```

## 1. Install and run the backend

You'll need [Node.js](https://nodejs.org) (v18+) installed.

```bash
cd prerana-website
npm install
cp .env.example .env
```

Now open `.env` and fill in:

- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — from your Razorpay Dashboard
  → Settings → API Keys. Use **Test Mode** keys first.
- `ADMIN_USERNAME` — whatever you want to log into `/admin` with.
- `ADMIN_PASSWORD_HASH` — see below, don't put a plain password here.
- `JWT_SECRET` — any long random string (e.g. run `openssl rand -hex 32`).
- `ALLOWED_ORIGINS` — the URL(s) your site will be served from.

### Setting the admin password

Passwords are stored as a bcrypt hash, never as plain text. Generate one with:

```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR-REAL-PASSWORD', 10))"
```

Paste the output into `ADMIN_PASSWORD_HASH` in `.env`.

### Start the server

```bash
npm start
```

This serves:
- the landing page at `http://localhost:4000`
- the admin panel at `http://localhost:4000/admin/login.html`
- the API at `http://localhost:4000/api/...`

If you're running the frontend separately (e.g. with a simple static
server or Live Server on a different port), update `API_BASE` near the
top of `public/js/main.js` and `admin/admin.js` to point at wherever the
backend actually runs.

## 2. Editing the content

- **Courses, prices, text**: all directly in `public/index.html`. Each
  course is one `<article class="course-card">…</article>` block — copy,
  paste, and edit to add or change a course. `data-fee` is the rupee
  amount used for checkout (leave it empty for "Contact Us" courses).
- **Colors and fonts**: the top of `public/css/style.css` has a `:root`
  block with named variables (`--green-900`, `--gold-500`, etc.) — change
  those and the whole site updates.
- **Contact links**: Telegram/WhatsApp links appear in the hero, register
  section, and footer of `index.html` — search for `t.me` and `wa.me`.

## 3. How the payment flow works

1. Student fills the form → `POST /api/register` saves their details and
   returns an id.
2. If the course has a fee, the browser asks our own server to create a
   Razorpay order (`POST /api/payment/create-order`). The secret key is
   used here only — it never reaches the browser.
3. Razorpay's checkout widget opens in the browser using the **public**
   key id and the order id.
4. After payment, the browser sends the result to
   `POST /api/payment/verify`, which recomputes the signature server-side
   to confirm the payment is genuine, then marks the registration as paid.

**Important:** while testing, use Razorpay's test card numbers (see their
docs) so you don't move real money. Switch `.env` to live keys only when
you're ready to go live, and test a real ₹1 transaction first.

## 4. Viewing registrations

Go to `/admin/login.html`, sign in with the username/password you set,
and you'll see every registration with name, contact info, course, and
payment status. Data is also readable directly in
`server/data/registrations.json` if you ever need to check it by hand or
back it up.

## 5. Deploying

This is a normal Node.js app, so it works on most hosts (Render, Railway,
a VPS, etc.):

1. Push the whole `prerana-website` folder to your host (don't commit the
   real `.env` file — set the same variables in your host's dashboard
   instead).
2. Run `npm install` then `npm start` (most hosts do this automatically).
3. Point your domain at the host.
4. Update `ALLOWED_ORIGINS` in your environment variables to your real
   domain, and update `API_BASE` in `public/js/main.js` / `admin/admin.js`
   if the frontend and backend end up on different domains.
5. In your Razorpay Dashboard, switch from Test to Live keys once you've
   confirmed everything works.

## 6. A few things worth doing before you go fully live

- Put the whole project in a private git repository so you have version
  history and backups.
- Consider moving from the JSON file store to a real database if you
  expect more than a few hundred registrations — the `dataStore.js`
  functions are written so you can swap the internals without touching
  the route files.
- Add HTTPS (most hosts do this for you automatically).
- Add real student testimonials in `index.html` in place of the sample
  quotes in the "Student Feedback" section.
