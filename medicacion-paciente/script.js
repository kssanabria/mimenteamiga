// ============================================================
//  MI MENTE AMIGA — PACIENTE / MEDICACIÓN · script.js
// ============================================================

const API_BASE_URL = 'http://localhost:3000/api';
const getToken     = () => localStorage.getItem('token');
const getPatientId = () => localStorage.getItem('patient_id');
const authHeaders  = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// ── Cargar medicamentos ───────────────────────────────────────
/**
 * GET /medications?patient_id=:id
 * Respuesta esperada: [{
 *   id, name, dosage,
 *   schedule: ['08:00', '14:00'],
 *   taken_times: ['08:00']
 * }]
 */
async function loadMedications() {
  const list = document.getElementById('medication-list');
  list.innerHTML = '<p class="loading-text">Cargando medicamentos...</p>';

  try {
    const res = await fetch(
      `${API_BASE_URL}/medications?patient_id=${getPatientId()}`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error('Error al cargar medicamentos');
    const medications = await res.json();
    renderMedicationList(medications);
  } catch (err) {
    console.error('loadMedications:', err);
    list.innerHTML = '<p class="loading-text">Error al cargar medicamentos.</p>';
  }
}

// ── Renderizar lista ──────────────────────────────────────────
/**
 * Estados del botón:
 * 'pending'   → aún no es la hora (gris, reloj, deshabilitado)
 * 'available' → es la hora y no tomado (azul, ✓, clickeable)
 * 'taken'     → ya tomado (verde, ✓, deshabilitado)
 */
function renderMedicationList(medications) {
  const list = document.getElementById('medication-list');

  if (!medications.length) {
    list.innerHTML = '<p class="loading-text">No tienes medicamentos asignados.</p>';
    return;
  }

  const now        = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  list.innerHTML = '';

  medications.forEach(med => {
    const schedule   = med.schedule    || [];
    const takenTimes = med.taken_times || [];

    schedule.forEach(time => {
      const [h, m]   = time.split(':').map(Number);
      const schedMin = h * 60 + m;
      const isTaken  = takenTimes.includes(time);
      const isTime   = currentMin >= schedMin;

      let btnClass, btnIcon, btnTitle, clickable;

      if (isTaken) {
        btnClass = 'taken';     btnIcon = '✓'; btnTitle = 'Tomada';             clickable = false;
      } else if (isTime) {
        btnClass = 'available'; btnIcon = '✓'; btnTitle = 'Marcar como tomada'; clickable = true;
      } else {
        btnClass = 'pending';   btnIcon = '🕐'; btnTitle = 'Aún no es la hora'; clickable = false;
      }

      const item = document.createElement('div');
      item.className = 'medication-item';
      item.innerHTML = `
        <div class="medication-info">
          <span class="medication-name">${med.name}</span>
          <span class="medication-detail">${time} — ${med.dosage}</span>
        </div>
        <button
          class="med-btn ${btnClass}"
          title="${btnTitle}"
          ${clickable ? `onclick="markTaken('${med.id}', '${time}', this)"` : 'disabled'}
        >${btnIcon}</button>
      `;
      list.appendChild(item);
    });
  });
}

// ── Marcar como tomada ────────────────────────────────────────
/**
 * POST /medication-logs
 * Body: { medication_id, patient_id, taken_at, status }
 */
async function markTaken(medicationId, time, btn) {
  btn.disabled = true;
  try {
    const res = await fetch(`${API_BASE_URL}/medication-logs`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        medication_id: medicationId,
        patient_id:    getPatientId(),
        taken_at:      new Date().toISOString(),
        status:        'taken'
      })
    });
    if (!res.ok) throw new Error('Error al registrar toma');

    btn.className   = 'med-btn taken';
    btn.textContent = '✓';
    btn.title       = 'Tomada';
  } catch (err) {
    console.error('markTaken:', err);
    btn.disabled = false;
    alert('No se pudo registrar la toma. Inténtalo de nuevo.');
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadMedications);