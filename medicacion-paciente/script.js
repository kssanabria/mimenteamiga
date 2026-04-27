// ============================================================
//  MI MENTE AMIGA — PACIENTE / MEDICACIÓN · script.js
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

// ── Cargar medicamentos ───────────────────────────────────────
/**
 * SELECT id, name, dossage, frecuency_per_day
 * FROM MEDICATION
 * WHERE patient_id = :patient_id
 */
async function loadMedications() {
  const list = document.getElementById('medication-list');
  list.innerHTML = '<p class="loading-text">Cargando medicamentos...</p>';

  try {
    // CONSULTA 1: medicamentos del paciente
    const { data: medications, error: medError } = await supabaseClient
      .from('MEDICATION')
      .select('id, name, dossage, frecuency_per_day')
      .eq('patient_id', getPatientId());

    if (medError) throw medError;

    if (!medications.length) {
      list.innerHTML = '<p class="loading-text">No tienes medicamentos asignados.</p>';
      return;
    }

    // CONSULTA 2: tomas registradas HOY para este paciente
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: takenToday, error: takenError } = await supabaseClient
      .from('MEDICATION_LOGS')
      .select('medication_id, taken_at')
      .eq('patient_id', getPatientId())
      .eq('status', 'taken')
      .gte('taken_at', todayStart.toISOString());

    if (takenError) throw takenError;

    // Set de medication_id ya tomados hoy
    const takenIds = new Set(takenToday.map(log => log.medication_id));

    renderMedicationList(medications, takenIds);

  } catch (err) {
    console.error('loadMedications:', err);
    list.innerHTML = '<p class="loading-text">Error al cargar medicamentos.</p>';
  }
}

// ── Renderizar lista ──────────────────────────────────────────
/**
 * Como no existe columna schedule, generamos las horas
 * automáticamente según frecuency_per_day:
 * 1x → ['08:00']
 * 2x → ['08:00', '20:00']
 * 3x → ['08:00', '14:00', '20:00']
 * 4x → ['08:00', '12:00', '18:00', '22:00']
 */
function getScheduleFromFrequency(freq) {
  const schedules = {
    1: ['08:00'],
    2: ['08:00', '20:00'],
    3: ['08:00', '14:00', '20:00'],
    4: ['08:00', '12:00', '18:00', '22:00']
  };
  return schedules[freq] || ['08:00'];
}

function renderMedicationList(medications, takenIds) {
  const list = document.getElementById('medication-list');

  const now        = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  list.innerHTML = '';

  medications.forEach(med => {
    const schedule = getScheduleFromFrequency(med.frecuency_per_day);
    const isTakenToday = takenIds.has(med.id);

    schedule.forEach(time => {
      const [h, m]   = time.split(':').map(Number);
      const schedMin = h * 60 + m;
      const isTime   = currentMin >= schedMin;

      let btnClass, btnIcon, btnTitle, clickable;

      if (isTakenToday) {
        btnClass = 'taken';     btnIcon = '✓'; btnTitle = 'Tomada';             clickable = false;
      } else if (isTime) {
        btnClass = 'available'; btnIcon = '✓'; btnTitle = 'Marcar como tomada'; clickable = true;
      } else {
        btnClass = 'pending';   btnIcon = '🕐'; btnTitle = 'Aún no es la hora'; clickable = false;
      }

      const item = document.createElement('div');
      item.className = 'medication-item';
      item.innerHTML = `
        <div class="medication-info">
          <span class="medication-name">${med.name}</span>
          <span class="medication-detail">${time} — ${med.dossage}</span>
        </div>
        <button
          class="med-btn ${btnClass}"
          title="${btnTitle}"
          ${clickable ? `onclick="markTaken('${med.id}', this)"` : 'disabled'}
        >${btnIcon}</button>
      `;
      list.appendChild(item);
    });
  });
}

// ── Marcar como tomada ────────────────────────────────────────
/**
 * INSERT INTO MEDICATION_LOGS
 * (medication_id, patient_id, taken_at, status)
 */
async function markTaken(medicationId, btn) {
  btn.disabled = true;
  try {
    // PASO 1: Obtiene el caregiver_id desde MEDICATION
    const { data: med, error: medError } = await supabaseClient
      .from('MEDICATION')
      .select('caregiver_id')
      .eq('id', medicationId)
      .single();

    if (medError) throw medError;

    // PASO 2: Inserta el log con el caregiver_id del medicamento
    const { error } = await supabaseClient
      .from('MEDICATION_LOGS')
      .insert({
        medication_id: medicationId,
        patient_id:    getPatientId(),
        caregiver_id:  med.caregiver_id,
        taken_at:      new Date().toISOString(),
        status:        'taken'
      });

    if (error) throw error;

    btn.className   = 'med-btn taken';
    btn.textContent = '✓';
    btn.title       = 'Tomada';
  } catch (err) {
    console.error('markTaken:', err);
    btn.disabled = false;
    alert('No se pudo registrar la toma. Inténtalo de nuevo.');
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!getPatientId()) {
    location.href = '../hu-01-login-paciente/index.html';
    return;
  }
  loadMedications();
});