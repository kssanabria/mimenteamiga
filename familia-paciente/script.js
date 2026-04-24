// ============================================================
//  MI MENTE AMIGA — PACIENTE / FAMILIA · script.js
// ============================================================

const API_BASE_URL = 'http://localhost:3000/api';
const getToken     = () => localStorage.getItem('token');
const getPatientId = () => localStorage.getItem('patient_id');
const authHeaders  = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// ── Cargar cuidador vinculado ─────────────────────────────────
/**
 * GET /patients/:id/caregiver
 * Respuesta esperada: { full_name, email, phone } | null
 */
async function loadLinkedCaregiver() {
  const card = document.getElementById('caregiver-card');

  try {
    const res = await fetch(
      `${API_BASE_URL}/patients/${getPatientId()}/caregiver`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();

    if (data && data.full_name) {
      card.innerHTML = `
        <div class="family-card-header">
          <span class="family-icon">👤</span>
          <strong>Cuidador</strong>
        </div>
        <div class="caregiver-info-row">
          <div class="caregiver-avatar-circle">
            ${data.full_name.charAt(0).toUpperCase()}
          </div>
          <div class="caregiver-details">
            <strong>${data.full_name}</strong>
            ${data.email ? `<span>${data.email}</span>` : ''}
            ${data.phone ? `<span>${data.phone}</span>` : ''}
          </div>
        </div>
      `;
    }
    // Si no hay cuidador, deja el estado vacío por defecto del HTML
  } catch (err) {
    console.error('loadLinkedCaregiver:', err);
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadLinkedCaregiver);