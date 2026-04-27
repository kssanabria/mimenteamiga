// ============================================================
//  MI MENTE AMIGA — PACIENTE / EMOCIÓN · script.js
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

const EMOJI_MAP = {
  Feliz: '😄', Normal: '😐', Triste: '😢', Enfadado: '😠', Ansioso: '😰'
};

let selectedEmotion = null;

// ── Selección de emoción ──────────────────────────────────────
function selectEmotion(card) {
  document.querySelectorAll('.emotion-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  selectedEmotion = card.dataset.emotion;

  const section = document.getElementById('comment-section');
  section.classList.add('visible');
}

// ── Guardar emoción ───────────────────────────────────────────
/**
 * INSERT INTO EMOTIONS
 * (patient_id, emotion_type, comments, created_at)
 */
async function submitEmotion() {
  if (!selectedEmotion) return;

  const comment = document.getElementById('emotion-comment').value.trim();
  const btn     = document.querySelector('.btn-save');

  btn.disabled    = true;
  btn.textContent = 'Guardando...';

  try {
    const { error } = await supabaseClient
      .from('EMOTIONS')
      .insert({
        patient_id:   getPatientId(),
        emotion_type: selectedEmotion,
        comments:     comment || null,  // columna correcta: comments
        created_at:   new Date().toISOString()
      });

    if (error) throw error;

    // Guarda la emoción para mostrar el emoji en la confirmación
    sessionStorage.setItem('saved_emotion', selectedEmotion);
    location.href = '../confirmacion-emocionpaciente/index.html';

  } catch (err) {
    console.error('submitEmotion:', err);
    alert('Hubo un error al guardar la emoción. Inténtalo de nuevo.');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Guardar';
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!getPatientId()) {
    location.href = '../login-paciente/index.html';
    return;
  }
});