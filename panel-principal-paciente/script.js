// ============================================================
//  MI MENTE AMIGA — PACIENTE / HOME · script.js
// ============================================================

const API_BASE_URL  = 'http://localhost:3000/api';
const getToken      = () => localStorage.getItem('token');
const getPatientId  = () => localStorage.getItem('patient_id');
const authHeaders   = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// ── Videos ───────────────────────────────────────────────────
function toggleVideos() {
  const container = document.getElementById('videos-container');
  container.classList.toggle('open');
}

// ── Saludo ───────────────────────────────────────────────────
/**
 * GET /patients/:id
 * Respuesta esperada: { full_name, ... }
 */
async function loadPatientProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/patients/${getPatientId()}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Error al cargar perfil');
    const data = await res.json();
    const el = document.getElementById('greeting-name');
    if (el) el.textContent = `Hola ${data.full_name}, ¿cómo te sientes hoy?`;
  } catch (err) {
    console.error('loadPatientProfile:', err);
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadPatientProfile();
});