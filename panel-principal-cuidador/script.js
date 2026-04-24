// ============================================================
//  MI MENTE AMIGA — CUIDADOR / HOME · script.js
// ============================================================

const API_BASE_URL   = 'http://localhost:3000/api';
const getToken       = () => localStorage.getItem('token');
const getCaregiverId = () => localStorage.getItem('caregiver_id');
const authHeaders    = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

/**
 * GET /caregivers/:id
 * Respuesta esperada: { full_name }
 */
async function loadCaregiverProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/caregivers/${getCaregiverId()}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const el = document.getElementById('caregiver-greeting');
    if (el) el.textContent = `Hola, ${data.full_name} 👋`;
  } catch (err) {
    console.error('loadCaregiverProfile:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadCaregiverProfile);