// ============================================================
//  MI MENTE AMIGA — CUIDADOR / PACIENTES · script.js
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

// ── Nombre del cuidador ───────────────────────────────────────
/**
 * SELECT full_name FROM CAREGIVER_PROFILE WHERE id = caregiver_id
 */
async function loadCaregiverName() {
  try {
    const { data, error } = await supabaseClient
      .from('CAREGIVER_PROFILE')
      .select('full_name')
      .eq('id', getCaregiverId())
      .maybeSingle();

    if (error) throw error;
    if (!data) return;

    const el = document.getElementById('caregiver-name');
    if (el) el.textContent = `Hola, ${data.full_name}`;
  } catch (err) {
    console.error('loadCaregiverName:', err);
  }
}

// ── Lista de pacientes ────────────────────────────────────────
/**
 * SELECT id, full_name, phone FROM PATIENT_PROFILE
 * WHERE caregiver_id = :caregiver_id
 *
 * + SELECT email FROM USERS WHERE id = patient.user_id
 * + SELECT name FROM MEDICATION WHERE patient_id = patient.id
 */
async function loadPatients() {
  const list = document.getElementById('patients-list');
  list.innerHTML = '<p class="loading-text">Cargando pacientes...</p>';

  try {
    // CONSULTA 1: obtiene los pacientes del cuidador
    const { data: patients, error: patientsError } = await supabaseClient
      .from('PATIENT_PROFILE')
      .select('id, full_name, user_id')
      .eq('caregiver_id', getCaregiverId());

    if (patientsError) throw patientsError;

    if (!patients.length) {
      list.innerHTML = '<p class="loading-text">No tienes pacientes registrados aún.</p>';
      return;
    }

    // CONSULTA 2: para cada paciente obtiene su email desde USERS
    // y sus medicamentos activos desde MEDICATION
    const patientsWithData = await Promise.all(patients.map(async p => {
      // Email del paciente
      const { data: userData } = await supabaseClient
        .from('USERS')
        .select('email')
        .eq('id', p.user_id)
        .maybeSingle();

      // Medicamentos activos del paciente
      const { data: meds } = await supabaseClient
        .from('MEDICATION')
        .select('name')
        .eq('patient_id', p.id);

      return {
        ...p,
        email: userData?.email ?? '',
        medications: meds || []
      };
    }));

    list.innerHTML = patientsWithData.map(p => `
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
          ${p.medications.length
            ? p.medications.map(m => `<span class="med-chip-sm">${m.name}</span>`).join('')
            : '<span style="font-size:0.82rem;color:var(--text-light)">Sin medicamentos</span>'
          }
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('loadPatients:', err);
    list.innerHTML = '<p class="loading-text">Error al cargar pacientes.</p>';
  }
}

// ── Redirige a registro de paciente ──────────────────────────
function goToAddPatient() {
  window.location.href = '../../registro-paciente/index.html';
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!getCaregiverId()) {
    location.href = '../hu-02-login-cuidador/index.html';
    return;
  }
  loadCaregiverName();
  loadPatients();
});