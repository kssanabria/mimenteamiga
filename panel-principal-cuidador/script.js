// ============================================================
//  MI MENTE AMIGA — CUIDADOR / HOME · script.js
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
const getCaregiverId = () => storage.get('caregiver_id');

// ── Cargar perfil del cuidador ────────────────────────────────
/**
 * Consulta directa a Supabase:
 * SELECT full_name FROM caregiver_profile WHERE id = caregiver_id
 */
async function loadCaregiverProfile() {
  try {
    const { data, error } = await supabaseClient
      .from('CAREGIVER_PROFILE')
      .select('full_name')
      .eq('id', getCaregiverId())
      .single();

    if (error) throw error;

    const el = document.getElementById('caregiver-greeting');
    if (el) el.textContent = `Hola, ${data.full_name} 👋`;
  } catch (err) {
    console.error('loadCaregiverProfile:', err);
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadCaregiverProfile);