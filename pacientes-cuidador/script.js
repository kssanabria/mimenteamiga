// ============================================================
//  MI MENTE AMIGA — CUIDADOR / PACIENTES · script.js
// ============================================================

const API_BASE_URL   = 'http://localhost:3000/api';
const getToken       = () => localStorage.getItem('token');
const getCaregiverId = () => localStorage.getItem('caregiver_id');
const authHeaders    = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// ── Nombre del cuidador ───────────────────────────────────────
/**
 * GET /caregivers/:id
 * Respuesta esperada: { full_name }
 */
async function loadCaregiverName() {
  try {
    const res = await fetch(`${API_BASE_URL}/caregivers/${getCaregiverId()}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const el = document.getElementById('caregiver-name');
    if (el) el.textContent = `Hola, ${data.full_name}`;
  } catch (err) {
    console.error('loadCaregiverName:', err);
  }
}

// ── Lista de pacientes ────────────────────────────────────────
/**
 * GET /caregivers/:id/patients
 * Respuesta esperada: [{
 *   id, full_name, email,
 *   active_medications: [{ name }]
 * }]
 */
async function loadPatients() {
  const list = document.getElementById('patients-list');
  list.innerHTML = '<p class="loading-text">Cargando pacientes...</p>';

  try {
    const res = await fetch(
      `${API_BASE_URL}/caregivers/${getCaregiverId()}/patients`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error();
    const patients = await res.json();

    if (!patients.length) {
      list.innerHTML = '<p class="loading-text">No tienes pacientes registrados aún.</p>';
      return;
    }

    list.innerHTML = patients.map(p => `
      <div class="patient-card">
        <div class="patient-card-top">
          <div class="patient-avatar">${p.full_name.charAt(0).toUpperCase()}</div>
          <div class="patient-info">
            <strong>${p.full_name}</strong>
            <span>${p.email}</span>
          </div>
        </div>
        <div class="patient-card-divider"></div>
        <p class="patient-meds-label">🔗 Medicaciones activas</p>
        <div class="patient-meds-chips">
          ${(p.active_medications || []).map(m =>
            `<span class="med-chip-sm">${m.name}</span>`
          ).join('') || '<span style="font-size:0.82rem;color:var(--text-light)">Sin medicamentos</span>'}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('loadPatients:', err);
    list.innerHTML = '<p class="loading-text">Error al cargar pacientes.</p>';
  }
}

// ── Redirige a interfaz de registro de paciente ───────────────
function goToAddPatient() {
  // Ajusta la ruta a tu interfaz existente de agregar paciente
  window.location.href = '../../registro-paciente/index.html';
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadCaregiverName();
  loadPatients();
});