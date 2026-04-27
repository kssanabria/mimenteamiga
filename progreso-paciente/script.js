// ============================================================
//  MI MENTE AMIGA — PACIENTE / PROGRESO · script.js
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
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ── Últimos 7 días ────────────────────────────────────────────
function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

function getSinceDate() {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  return since.toISOString();
}

// ── Historial de Emociones ────────────────────────────────────
/**
 * SELECT emotion_type, created_at FROM EMOTIONS
 * WHERE patient_id = :patient_id
 * AND created_at >= hace 7 días
 */
async function renderEmotionHistory() {
  const container = document.getElementById('emotion-history');
  container.innerHTML = '<p class="loading-text">Cargando...</p>';

  const days = getLast7Days();

  try {
    const { data: history, error } = await supabaseClient
      .from('EMOTIONS')
      .select('emotion_type, created_at')
      .eq('patient_id', getPatientId())
      .gte('created_at', getSinceDate())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mapa fecha → emotion_type (última del día)
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
 * SELECT medication_id, taken_at FROM MEDICATION_LOGS
 * WHERE patient_id = :patient_id
 * AND status = 'taken'
 * AND taken_at >= hace 7 días
 *
 * + SELECT name FROM MEDICATION WHERE id = :medication_id
 */
async function renderMedicationHistory() {
  const container = document.getElementById('medication-history');
  container.innerHTML = '<p class="loading-text">Cargando...</p>';

  try {
    // CONSULTA 1: logs de tomas de los últimos 7 días
    const { data: logs, error: logsError } = await supabaseClient
      .from('MEDICATION_LOGS')
      .select('medication_id, taken_at')
      .eq('patient_id', getPatientId())
      .eq('status', 'taken')
      .gte('taken_at', getSinceDate())
      .order('taken_at', { ascending: false });

    if (logsError) throw logsError;

    if (!logs.length) {
      container.innerHTML = '<p class="loading-text">Sin registros aún</p>';
      return;
    }

    // CONSULTA 2: nombres de los medicamentos
    const medIds = [...new Set(logs.map(l => l.medication_id))];
    const { data: meds, error: medsError } = await supabaseClient
      .from('MEDICATION')
      .select('id, name')
      .in('id', medIds);

    if (medsError) throw medsError;

    // Mapa id → name
    const medMap = {};
    meds.forEach(m => { medMap[m.id] = m.name; });

    // Agrupa logs por fecha
    const grouped = {};
    logs.forEach(log => {
      const date = log.taken_at.slice(0, 10);
      if (!grouped[date]) grouped[date] = [];
      const name = medMap[log.medication_id] ?? 'Medicamento';
      if (!grouped[date].includes(name)) grouped[date].push(name);
    });

    container.innerHTML = Object.entries(grouped)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, medNames]) => {
        const d     = new Date(date + 'T00:00:00');
        const label = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        const chips = medNames.map(n => `<span class="med-chip">✓ ${n}</span>`).join('');
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
  if (!getPatientId()) {
    location.href = '../hu-01-login-paciente/index.html';
    return;
  }
  renderEmotionHistory();
  renderMedicationHistory();
});