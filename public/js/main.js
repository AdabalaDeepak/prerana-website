// =============================================================
// PRERANA DEFENCE ACADEMY — front-end behaviour
// This file only talks to OUR OWN backend (see /server). It never
// holds a Razorpay secret key — that lives only on the server.
// =============================================================

// ---- Config: point this at wherever the backend is running ----
// During local development this is usually http://localhost:4000
// After you deploy the backend, change this to your live API URL.
const API_BASE = window.location.origin.includes('localhost')
  ? 'http://localhost:4000'
  : ''; // '' means "same domain as this page" once deployed together

document.getElementById('year').textContent = new Date().getFullYear();

// ---------------- Mobile nav ----------------
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
navToggle.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
navMenu.querySelectorAll('a').forEach(link =>
  link.addEventListener('click', () => navMenu.classList.remove('open'))
);

// ---------------- Enroll buttons and course links pre-fill the form ----------------
const courseSelect = document.getElementById('courseSelect');
const feeField = document.getElementById('feeField');

function prefillCourseFromCard(element) {
  const card = element.closest('[data-course]');
  const courseName = card ? card.dataset.course : element.dataset.course;
  const fee = card ? card.dataset.fee : element.dataset.fee;

  const matchingOption = [...courseSelect.options].find(opt => opt.textContent.trim().startsWith(courseName));
  if (matchingOption) {
    courseSelect.value = matchingOption.value;
  }
  feeField.value = fee || '';

  document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
}

document.querySelectorAll('.course-card .enroll-btn, .course-card .btn-outline').forEach(control => {
  control.addEventListener('click', (event) => {
    event.preventDefault();
    prefillCourseFromCard(control);
  });
});

// Keep the hidden fee field in sync when the student picks a course manually
courseSelect.addEventListener('change', () => {
  const opt = courseSelect.selectedOptions[0];
  feeField.value = opt?.dataset.fee || '';
});

// ---------------- Registration form submit ----------------
const form = document.getElementById('registerForm');
const statusEl = document.getElementById('formStatus');
const submitBtn = document.getElementById('registerSubmit');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = '';

  const data = Object.fromEntries(new FormData(form).entries());

  if (!/^[0-9]{10}$/.test(data.phone)) {
    statusEl.textContent = 'Please enter a valid 10-digit phone number.';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  try {
    // Step 1: save the registration on our backend
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Registration failed');
    const { registrationId } = await res.json();

    const fee = Number(data.fee || 0);

    if (fee > 0) {
      await startRazorpayCheckout({ registrationId, name: data.name, email: data.email, phone: data.phone, amountRupees: fee });
    } else {
      statusEl.textContent = 'Thanks! We received your details and will reach out on WhatsApp shortly.';
      form.reset();
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Something went wrong. Please try again or message us on WhatsApp.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit & Continue';
  }
});

// ---------------- Razorpay checkout ----------------
async function startRazorpayCheckout({ registrationId, name, email, phone, amountRupees }) {
  // Step 2: ask OUR server to create a Razorpay order (this is where the
  // secret key is used — never in this file).
  const orderRes = await fetch(`${API_BASE}/api/payment/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationId, amountRupees })
  });
  if (!orderRes.ok) throw new Error('Could not create payment order');
  const order = await orderRes.json();

  const options = {
    key: order.keyId, // Razorpay PUBLIC key id, safe to expose
    amount: order.amount,
    currency: order.currency,
    name: 'Prerana Defence Academy',
    description: 'Course Registration',
    order_id: order.id,
    prefill: { name, email, contact: phone },
    theme: { color: '#0d2818' },
    handler: async function (response) {
      // Step 3: ask our server to verify the payment signature
      const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...response, registrationId })
      });
      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.verified) {
        statusEl.textContent = 'Payment successful! We will confirm your seat on WhatsApp shortly.';
        form.reset();
      } else {
        statusEl.textContent = 'Payment could not be verified. Please contact us on WhatsApp with your payment ID.';
      }
    },
    modal: {
      ondismiss: function () {
        statusEl.textContent = 'Payment window closed. Your details are saved — you can retry anytime.';
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}
