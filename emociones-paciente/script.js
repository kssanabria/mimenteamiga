// ============================================================
//  MI MENTE AMIGA — PACIENTE / EMOCIÓN · script.js
// ============================================================

const API_BASE_URL = 'http://localhost:3000/api';
const getToken     = () => localStorage.getItem('token');
const getPatientId = () => localStorage.getItem('patient_id');
const authHeaders  = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

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
 * POST /emotions
 * Body: { patient_id, emotion_type, comment }
 */
async function submitEmotion() {
  if (!selectedEmotion) return;
  const comment = document.getElementById('emotion-comment').value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/emotions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        patient_id:   getPatientId(),
        emotion_type: selectedEmotion,
        comment:      comment
      })
    });
    if (!res.ok) throw new Error('Error al guardar emoción');

    // Guarda el emoji para mostrarlo en la pantalla de confirmación
    sessionStorage.setItem('saved_emotion', selectedEmotion);
    location.href = '../confirmacion-emocionPaciente/index.html';
  } catch (err) {
    console.error('submitEmotion:', err);
    alert('Hubo un error al guardar la emoción. Inténtalo de nuevo.');
  }
}