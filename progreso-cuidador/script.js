// ============================================================
//  MI MENTE AMIGA — CUIDADOR / PROGRESO · script.js
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

const EMOJI_MAP = {
  Feliz: '😄', Normal: '😐', Triste: '😢', Enfadado: '😠', Ansioso: '😰'
};
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ── Utilidades ────────────────────────────────────────────────
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
 * 1. SELECT id, full_name FROM PATIENT_PROFILE WHERE caregiver_id = :id
 * 2. Para cada paciente:
 *    SELECT emotion_type, created_at FROM EMOTIONS
 *    WHERE patient_id = :patient_id AND created_at >= hace 7 días
 */
async function renderEmotionHistory() {
  const container = document.getElementById('emotion-history');
  container.innerHTML = '<p class="loading-text">Cargando...</p>';

  const days = getLast7Days();

  try {
    // CONSULTA 1: pacientes del cuidador
    const { data: patients, error: patientsError } = await supabaseClient
      .from('PATIENT_PROFILE')
      .select('id, full_name')
      .eq('caregiver_id', getCaregiverId());

    if (patientsError) throw patientsError;

    if (!patients.length) {
      container.innerHTML = '<p class="loading-text">Sin registros aún</p>';
      return;
    }

    // CONSULTA 2: emociones de cada paciente
    const patientsWithEmotions = await Promise.all(patients.map(async p => {
      const { data: emotions } = await supabaseClient
        .from('EMOTIONS')
        .select('emotion_type, created_at')
        .eq('patient_id', p.id)
        .gte('created_at', getSinceDate())
        .order('created_at', { ascending: true });

      return { ...p, emotions: emotions || [] };
    }));

    const blocks = patientsWithEmotions.map(patient => {
      // Mapa fecha → emotion_type
      const byDate = {};
      patient.emotions.forEach(e => {
        byDate[e.created_at.slice(0, 10)] = e.emotion_type;
      });

      const dayItems = days.map(d => {
        const key     = d.toISOString().slice(0, 10);
        const emotion = byDate[key];
        return `
          <div class="day-item">
            <span class="day-emoji">${emotion ? (EMOJI_MAP[emotion] ?? '—') : '—'}</span>
            <span class="day-label">${DAYS_ES[d.getDay()]}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="emotion-patient-block">
          <span class="emotion-patient-name">${patient.full_name}</span>
          <div class="emotion-days">${dayItems}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="emotion-week">${blocks}</div>`;

  } catch (err) {
    console.error('renderEmotionHistory:', err);
    container.innerHTML = '<p class="loading-text">Sin registros aún</p>';
  }
}

// ── Historial de Medicación ───────────────────────────────────
/**
 * 1. SELECT id FROM PATIENT_PROFILE WHERE caregiver_id = :id
 * 2. SELECT medication_id, taken_at FROM MEDICATION_LOGS
 *    WHERE patient_id IN (:patientIds) AND status = 'taken'
 *    AND taken_at >= hace 7 días
 * 3. SELECT id, name FROM MEDICATION WHERE id IN (:medIds)
 */
async function renderMedicationHistory() {
  const container = document.getElementById('medication-history');
  container.innerHTML = '<p class="loading-text">Cargando...</p>';

  try {
    // CONSULTA 1: ids de los pacientes del cuidador
    const { data: patients, error: patientsError } = await supabaseClient
      .from('PATIENT_PROFILE')
      .select('id')
      .eq('caregiver_id', getCaregiverId());

    if (patientsError) throw patientsError;

    if (!patients.length) {
      container.innerHTML = '<p class="loading-text">Sin registros aún</p>';
      return;
    }

    const patientIds = patients.map(p => p.id);

    // CONSULTA 2: logs de tomas de todos los pacientes
    const { data: logs, error: logsError } = await supabaseClient
      .from('MEDICATION_LOGS')
      .select('medication_id, taken_at, patient_id')
      .in('patient_id', patientIds)
      .eq('status', 'taken')
      .gte('taken_at', getSinceDate())
      .order('taken_at', { ascending: false });

    if (logsError) throw logsError;

    if (!logs.length) {
      container.innerHTML = '<p class="loading-text">Sin registros aún</p>';
      return;
    }

    // CONSULTA 3: nombres de los medicamentos
    const medIds = [...new Set(logs.map(l => l.medication_id))];
    const { data: meds, error: medsError } = await supabaseClient
      .from('MEDICATION')
      .select('id, name')
      .in('id', medIds);

    if (medsError) throw medsError;

    // Mapa id → name
    const medMap = {};
    meds.forEach(m => { medMap[m.id] = m.name; });

    // Agrupa por fecha
    const grouped = {};
    logs.forEach(log => {
      const date = log.taken_at.slice(0, 10);
      if (!grouped[date]) grouped[date] = [];
      const name = medMap[log.medication_id] ?? 'Medicamento';
      if (!grouped[date].includes(name)) grouped[date].push(name);
    });

    const rows = Object.entries(grouped)
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

    container.innerHTML = `<div class="med-history-list">${rows}</div>`;

  } catch (err) {
    console.error('renderMedicationHistory:', err);
    container.innerHTML = '<p class="loading-text">Sin registros aún</p>';
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!getCaregiverId()) {
    location.href = '../hu-02-login-cuidador/index.html';
    return;
  }
  renderEmotionHistory();
  renderMedicationHistory();
});