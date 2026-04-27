// ============================================================
//  MI MENTE AMIGA — PACIENTE / FAMILIA · script.js
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

const getPatientId = () => storage.get('patient_id');

// ── Cargar cuidador vinculado ─────────────────────────────────
/**
 * 1. SELECT caregiver_id FROM PATIENT_PROFILE WHERE id = :patient_id
 * 2. SELECT full_name, telefono, user_id FROM CAREGIVER_PROFILE WHERE id = :caregiver_id
 * 3. SELECT email FROM USERS WHERE id = :user_id
 */
async function loadLinkedCaregiver() {
  const card = document.getElementById('caregiver-card');

  try {
    // CONSULTA 1
    const { data: patient, error: patientError } = await supabaseClient
      .from('PATIENT_PROFILE')
      .select('caregiver_id')
      .eq('id', getPatientId())
      .maybeSingle();

    console.log('patient_id usado:', getPatientId());  // ← agrega
    console.log('patient data:', patient);              // ← agrega
    console.log('patient error:', patientError);        // ← agrega

    if (patientError) throw patientError;
    if (!patient || !patient.caregiver_id) {
      console.log('No hay caregiver_id vinculado');     // ← agrega
      return;
    }

    // CONSULTA 2
    const { data: caregiver, error: caregiverError } = await supabaseClient
      .from('CAREGIVER_PROFILE')
      .select('full_name, telefono, user_id')
      .eq('id', patient.caregiver_id)
      .maybeSingle();

    console.log('caregiver data:', caregiver);          // ← agrega
    console.log('caregiver error:', caregiverError);    // ← agrega

    if (caregiverError) throw caregiverError;
    if (!caregiver) return;

    // CONSULTA 3
    const { data: user, error: userError } = await supabaseClient
      .from('USERS')
      .select('email')
      .eq('id', caregiver.user_id)
      .maybeSingle();

    console.log('user data:', user);                    // ← agrega
    console.log('user error:', userError);              // ← agrega

    if (userError) throw userError;

    const email    = user?.email    ?? '';
    const telefono = caregiver.telefono ?? '';

    card.innerHTML = `
      <div class="family-card-header">
        <span class="family-icon">👤</span>
        <strong>Cuidador</strong>
      </div>
      <div class="caregiver-info-row">
        <div class="caregiver-avatar-circle">
          ${caregiver.full_name.charAt(0).toUpperCase()}
        </div>
        <div class="caregiver-details">
          <strong>${caregiver.full_name}</strong>
          ${email    ? `<span>${email}</span>`    : ''}
          ${telefono ? `<span>${telefono}</span>` : ''}
        </div>
      </div>
    `;

  } catch (err) {
    console.error('loadLinkedCaregiver:', err);
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!getPatientId()) {
    location.href = '../login-paciente/index.html';
    return;
  }
  loadLinkedCaregiver();
});