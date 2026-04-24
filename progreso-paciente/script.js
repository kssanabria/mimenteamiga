// ============================================================
//  MI MENTE AMIGA — PACIENTE / PROGRESO · script.js
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
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ── Historial de Emociones ────────────────────────────────────
/**
 * GET /emotions?patient_id=:id&days=7
 * Respuesta esperada: [{ created_at: 'YYYY-MM-DD', emotion_type: string }]
 */
async function renderEmotionHistory() {
  const container = document.getElementById('emotion-history');
  container.innerHTML = '<p class="loading-text">Cargando...</p>';

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  try {
    const res = await fetch(
      `${API_BASE_URL}/emotions?patient_id=${getPatientId()}&days=7`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error();
    const history = await res.json();

    const emotionByDate = {};
    history.forEach(e => {
      emotionByDate[e.created_at.slice(0, 10)] = e.emotion_type;
    });

    container.innerHTML = days.map(d => {
      const key     = d.toISOString().slice(0, 10);
      const emotion = emotionByDate[key];
      return `
        <div class="day-item">
          <span class="day-emoji">${emotion ? (EMOJI_MAP[emotion] ?? '—') : '—'}</span>
          <span class="day-label">${DAYS_ES[d.getDay()]}</span>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('renderEmotionHistory:', err);
    container.innerHTML = '<p class="loading-text">Error al cargar.</p>';
  }
}

// ── Historial de Medicación ───────────────────────────────────
/**
 * GET /medication-logs?patient_id=:id&days=7
 * Respuesta esperada: [{ taken_at: 'YYYY-MM-DDTHH:mm', medication_name: string }]
 */
async function renderMedicationHistory() {
  const container = document.getElementById('medication-history');
  container.innerHTML = '<p class="loading-text">Cargando...</p>';

  try {
    const res = await fetch(
      `${API_BASE_URL}/medication-logs?patient_id=${getPatientId()}&days=7`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error();
    const history = await res.json();

    if (!history.length) {
      container.innerHTML = '<p class="loading-text">Sin registros aún</p>';
      return;
    }

    // Agrupa por fecha
    const grouped = {};
    history.forEach(item => {
      const date = item.taken_at.slice(0, 10);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item.medication_name);
    });

    container.innerHTML = Object.entries(grouped)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, meds]) => {
        const d     = new Date(date + 'T00:00:00');
        const label = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        const chips = meds.map(m => `<span class="med-chip">✓ ${m}</span>`).join('');
        return `
          <div class="history-row">
            <span class="history-date">${label}</span>
            <div class="history-chips">${chips}</div>
          </div>
        `;
      }).join('');
  } catch (err) {
    console.error('renderMedicationHistory:', err);
    container.innerHTML = '<p class="loading-text">Error al cargar.</p>';
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderEmotionHistory();
  renderMedicationHistory();
});