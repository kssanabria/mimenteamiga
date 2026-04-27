// ============================================================
//  MI MENTE AMIGA — PACIENTE / EMOCIÓN CONFIRMACIÓN · script.js
// ============================================================

const EMOJI_MAP = {
  Feliz: '😄', Normal: '😐', Triste: '😢', Enfadado: '😠', Ansioso: '😰'
};

// Recupera la emoción guardada desde la pantalla anterior
document.addEventListener('DOMContentLoaded', () => {
  const emotion   = sessionStorage.getItem('saved_emotion');
  const emojiEl   = document.getElementById('saved-emoji');
  if (emotion && emojiEl) {
    emojiEl.textContent = EMOJI_MAP[emotion] ?? '😊';
  }
  // Limpia sessionStorage para la próxima vez
  sessionStorage.removeItem('saved_emotion');
});