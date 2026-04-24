// ============================================================
//  MI MENTE AMIGA — CUIDADOR / MEDICACIÓN · script.js
// ============================================================

const API_BASE_URL   = 'http://localhost:3000/api';
const getToken       = () => localStorage.getItem('token');
const getCaregiverId = () => localStorage.getItem('caregiver_id');
const authHeaders    = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// ── Cargar acordeón de pacientes ──────────────────────────────
/**
 * GET /caregivers/:id/patients
 * Respuesta esperada: [{ id, full_name, email }]
 */
async function loadMedicationAccordion() {
  const container = document.getElementById('patients-accordion');
  container.innerHTML = '<p class="loading-text">Cargando pacientes...</p>';

  try {
    const res = await fetch(
      `${API_BASE_URL}/caregivers/${getCaregiverId()}/patients`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error();
    const patients = await res.json();

    if (!patients.length) {
      container.innerHTML = '<p class="loading-text">No tienes pacientes registrados.</p>';
      return;
    }

    container.innerHTML = patients.map(p => `
      <div class="accordion-item" id="accordion-${p.id}">
        <div class="accordion-header" onclick="toggleAccordion('${p.id}')">
          <div class="accordion-patient-info">
            <div class="accordion-avatar">${p.full_name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="accordion-name">${p.full_name}</div>
              <div class="accordion-email">${p.email}</div>
            </div>
          </div>
          <span class="accordion-arrow" id="arrow-${p.id}">▼</span>
        </div>
        <div class="accordion-body" id="body-${p.id}">
          <button class="btn-add-med" onclick="goToAddMedication('${p.id}')">
            + Agregar nueva medicación
          </button>
          <div id="meds-${p.id}">
            <p class="loading-text">Cargando...</p>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('loadMedicationAccordion:', err);
    container.innerHTML = '<p class="loading-text">Error al cargar.</p>';
  }
}

// ── Toggle acordeón ───────────────────────────────────────────
async function toggleAccordion(patientId) {
  const body  = document.getElementById(`body-${patientId}`);
  const arrow = document.getElementById(`arrow-${patientId}`);
  const isOpen = body.classList.contains('open');

  // Cierra todos
  document.querySelectorAll('.accordion-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.accordion-arrow').forEach(a => a.classList.remove('open'));

  if (!isOpen) {
    body.classList.add('open');
    arrow.classList.add('open');
    await loadPatientMedications(patientId);
  }
}

// ── Cargar medicamentos de un paciente ────────────────────────
/**
 * GET /medications?patient_id=:id
 * Respuesta esperada: [{
 *   id, name, dosage,
 *   schedule: ['08:00', '14:00'],
 *   end_date, comentarios
 * }]
 */
async function loadPatientMedications(patientId) {
  const container = document.getElementById(`meds-${patientId}`);
  if (!container) return;
  container.innerHTML = '<p class="loading-text">Cargando...</p>';

  try {
    const res = await fetch(
      `${API_BASE_URL}/medications?patient_id=${patientId}`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error();
    const meds = await res.json();

    if (!meds.length) {
      container.innerHTML = '<p class="loading-text">Sin medicamentos aún.</p>';
      return;
    }

    container.innerHTML = meds.map(m => `
      <div class="med-row" id="med-row-${m.id}">
        <div class="med-row-info">
          <span class="med-row-name">${m.name}</span>
          <span class="med-row-detail">${m.dosage}</span>
          <span class="med-row-time">🕐 ${(m.schedule || []).join(' · ')}</span>
        </div>
        <div class="med-row-actions">
          <button
            class="med-action-btn edit"
            title="Editar"
            onclick="goToEditMedication('${patientId}', '${m.id}')"
          >✏️</button>
          <button
            class="med-action-btn delete"
            title="Eliminar"
            onclick="deleteMedication('${m.id}', '${patientId}')"
          >🗑️</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('loadPatientMedications:', err);
    container.innerHTML = '<p class="loading-text">Error al cargar medicamentos.</p>';
  }
}

// ── Navegar al modal (nueva medicación) ───────────────────────
function goToAddMedication(patientId) {
  // Guarda el patient_id para usarlo en el modal
  sessionStorage.setItem('modal_patient_id', patientId);
  sessionStorage.removeItem('modal_med_id');
  location.href = '../medicacion-modal-cuidador/index.html';
}

// ── Navegar al modal (editar medicación) ─────────────────────
function goToEditMedication(patientId, medId) {
  sessionStorage.setItem('modal_patient_id', patientId);
  sessionStorage.setItem('modal_med_id', medId);
  location.href = '../medicacion-modal-cuidador/index.html';
}

// ── Eliminar medicamento ──────────────────────────────────────
/**
 * DELETE /medications/:id
 */
async function deleteMedication(medId, patientId) {
  if (!confirm('¿Estás seguro de que quieres eliminar este medicamento?')) return;

  try {
    const res = await fetch(`${API_BASE_URL}/medications/${medId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error();
    // Refresca la lista del paciente
    await loadPatientMedications(patientId);
  } catch (err) {
    console.error('deleteMedication:', err);
    alert('No se pudo eliminar el medicamento. Inténtalo de nuevo.');
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadMedicationAccordion);