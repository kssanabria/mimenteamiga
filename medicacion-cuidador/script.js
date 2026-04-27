// ============================================================
//  MI MENTE AMIGA — CUIDADOR / MEDICACIÓN · script.js
// ============================================================

// ── Inicializa Supabase ───────────────────────────────────────
const SUPABASE_URL   = 'https://fevgeitgmrmcbxqtxyyw.supabase.co';
const SUPABASE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldmdlaXRnbXJtY2J4cXR4eXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTYzMjcsImV4cCI6MjA5MjYzMjMyN30.oBygQByRsFpekJdutoGMHFGyDz8cpBi1qPx3Iv2c9kQ';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Storage helper ────────────────────────────────────────────
const storage = {
  get(key) {
    try { return localStorage.getItem(key); }
    catch (err) { console.warn('localStorage bloqueado:', err); return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); }
    catch (err) { console.warn('localStorage bloqueado:', err); }
  },
  remove(key) {
    try { localStorage.removeItem(key); }
    catch (err) { console.warn('localStorage bloqueado:', err); }
  }
};

const getCaregiverId = () => storage.get('caregiver_id');

// ── Cargar acordeón de pacientes ──────────────────────────────
/**
 * SELECT id, full_name, user_id FROM PATIENT_PROFILE
 * WHERE caregiver_id = :caregiver_id
 */
async function loadMedicationAccordion() {
  const container = document.getElementById('patients-accordion');
  container.innerHTML = '<p class="loading-text">Cargando pacientes...</p>';

  try {
    const { data: patients, error } = await supabaseClient
      .from('PATIENT_PROFILE')
      .select('id, full_name, user_id')
      .eq('caregiver_id', getCaregiverId());

    if (error) throw error;

    if (!patients.length) {
      container.innerHTML = '<p class="loading-text">No tienes pacientes registrados.</p>';
      return;
    }

    // Para cada paciente obtiene su email desde USERS
    const patientsWithEmail = await Promise.all(patients.map(async p => {
      const { data: userData } = await supabaseClient
        .from('USERS')
        .select('email')
        .eq('id', p.user_id)
        .maybeSingle();

      return { ...p, email: userData?.email ?? '' };
    }));

    container.innerHTML = patientsWithEmail.map(p => `
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
 * SELECT id, name, dossage, frecuency_per_day, end_date, comments
 * FROM MEDICATION
 * WHERE patient_id = :patientId
 */
async function loadPatientMedications(patientId) {
  const container = document.getElementById(`meds-${patientId}`);
  if (!container) return;
  container.innerHTML = '<p class="loading-text">Cargando...</p>';

  try {
    const { data: meds, error } = await supabaseClient
      .from('MEDICATION')
      .select('id, name, dossage, frecuency_per_day, end_date, comments')
      .eq('patient_id', patientId);
    console.log('Medicamentos encontrados:', meds);  // ← agrega
    console.log('Error:', error);  
    // Ejecuta en consola
console.log('Pacientes del acordeón:');
document.querySelectorAll('.accordion-item').forEach(el => {
  console.log('accordion id:', el.id);
});
    if (error) throw error;

    if (!meds.length) {
      container.innerHTML = '<p class="loading-text">Sin medicamentos aún.</p>';
      return;
    }

    container.innerHTML = meds.map(m => `
      <div class="med-row" id="med-row-${m.id}">
        <div class="med-row-info">
          <span class="med-row-name">${m.name}</span>
          <span class="med-row-detail">${m.dossage} · ${m.frecuency_per_day}x al día</span>
          ${m.end_date ? `<span class="med-row-time">🕐 Hasta: ${new Date(m.end_date).toLocaleDateString('es-ES')}</span>` : ''}
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
 * DELETE FROM MEDICATION_LOGS WHERE medication_id = :medId
 * DELETE FROM MEDICATION WHERE id = :medId
 */
async function deleteMedication(medId, patientId) {
  if (!confirm('¿Estás seguro de que quieres eliminar este medicamento?')) return;

  try {
    // PASO 1: Elimina los logs asociados
    const { error: logError } = await supabaseClient
      .from('MEDICATION_LOGS')
      .delete()
      .eq('medication_id', medId);

    if (logError) throw logError;

    // PASO 2: Elimina el medicamento
    const { error: medError } = await supabaseClient
      .from('MEDICATION')
      .delete()
      .eq('id', medId);

    if (medError) throw medError;

    // Refresca la lista
    await loadPatientMedications(patientId);

  } catch (err) {
    console.error('deleteMedication:', err);
    alert('No se pudo eliminar el medicamento. Inténtalo de nuevo.');
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!getCaregiverId()) {
    location.href = '../login-cuidador/index.html';
    return;
  }
  loadMedicationAccordion();
});