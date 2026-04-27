// ============================================================
//  MI MENTE AMIGA — PACIENTE / HOME · script.js
// ============================================================

// ── Inicializa Supabase ───────────────────────────────────────
const SUPABASE_URL = 'https://fevgeitgmrmcbxqtxyyw.supabase.co'; // Tu URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldmdlaXRnbXJtY2J4cXR4eXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTYzMjcsImV4cCI6MjA5MjYzMjMyN30.oBygQByRsFpekJdutoGMHFGyDz8cpBi1qPx3Iv2c9kQ';               // Tu anon key
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.warn('localStorage bloqueado:', err);
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn('localStorage bloqueado:', err);
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn('localStorage bloqueado:', err);
    }
  }
};
const getPatientId = () => storage.get('patient_id');

// ── Videos ───────────────────────────────────────────────────
function toggleVideos() {
  const container = document.getElementById('videos-container');
  container.classList.toggle('open');
}

// ── Cargar perfil del paciente ────────────────────────────────
/**
 * Consulta directa a Supabase:
 * SELECT full_name FROM patient_profile WHERE id = patient_id
 */
async function loadPatientProfile() {
  try {
    const { data, error } = await supabaseClient
      .from('PATIENT_PROFILE')
      .select('full_name')
      .eq('id', getPatientId())
      .single();

    if (error) throw error;

    const el = document.getElementById('greeting-name');
    if (el) el.textContent = `Hola ${data.full_name}, ¿cómo te sientes hoy?`;
  } catch (err) {
    console.error('loadPatientProfile:', err);
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadPatientProfile);