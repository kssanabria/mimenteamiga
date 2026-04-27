// ============================================================
//  MI MENTE AMIGA — CUIDADOR / MEDICACIÓN MODAL · script.js
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

// Recuperados desde sessionStorage
const patientId = sessionStorage.getItem('modal_patient_id');
const medId     = sessionStorage.getItem('modal_med_id'); // null si es nueva

let selectedFreq = 1;

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (!getCaregiverId()) {
    location.href = '../login-cuidador/index.html';
    return;
  }

  if (!patientId) {
    alert('No se encontró el paciente. Vuelve a intentarlo.');
    location.href = '../medicacion-cuidador/index.html';
    return;
  }

  if (medId) {
    document.getElementById('modal-title').textContent = 'Editar Medicación';
    await loadMedicationData(medId);
  } else {
    renderTimeInputs(1, []);
  }
});

// ── Cargar datos del medicamento (modo edición) ───────────────
/**
 * SELECT name, dossage, frecuency_per_day, end_date, comments
 * FROM MEDICATION WHERE id = :medId
 */
async function loadMedicationData(id) {
  try {
    const { data: med, error } = await supabaseClient
      .from('MEDICATION')
      .select('name, dossage, frecuency_per_day, end_date, comments')
      .eq('id', id)
      .single();

    if (error) throw error;

    document.getElementById('med-name').value         = med.name         || '';
    document.getElementById('med-dosage').value       = med.dossage      || '';
    document.getElementById('med-end-date').value     = med.end_date     ? med.end_date.slice(0, 10) : '';
    document.getElementById('med-instructions').value = med.comments     || '';

    const freq    = med.frecuency_per_day || 1;
    const freqBtn = document.querySelector(`.freq-btn[data-freq="${freq}"]`);
    if (freqBtn) selectFrequency(freqBtn);

    renderTimeInputs(freq, []);
  } catch (err) {
    console.error('loadMedicationData:', err);
    alert('No se pudo cargar el medicamento.');
    location.href = '../medicacion-cuidador/index.html';
  }
}

// ── Frecuencia ────────────────────────────────────────────────
function selectFrequency(btn) {
  document.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedFreq = parseInt(btn.dataset.freq, 10);
  renderTimeInputs(selectedFreq, []);
}

// ── Inputs de hora ────────────────────────────────────────────
function renderTimeInputs(count, existingTimes = []) {
  const defaults  = ['08:00', '14:00', '20:00', '22:00'];
  const container = document.getElementById('time-inputs');
  container.innerHTML = Array.from({ length: count }, (_, i) => `
    <div class="time-input-row">
      <span>Toma ${i + 1}</span>
      <input type="time" class="time-input" value="${existingTimes[i] || defaults[i] || '08:00'}" />
    </div>
  `).join('');
}

function getScheduleTimes() {
  return Array.from(document.querySelectorAll('#time-inputs .time-input'))
    .map(input => input.value);
}

// ── Guardar medicamento ───────────────────────────────────────
/**
 * NUEVO:  INSERT INTO MEDICATION
 * EDITAR: UPDATE MEDICATION WHERE id = :medId
 */
async function saveMedication() {
  const name         = document.getElementById('med-name').value.trim();
  const dossage      = document.getElementById('med-dosage').value.trim();
  const endDate      = document.getElementById('med-end-date').value;
  const comments     = document.getElementById('med-instructions').value.trim();

  if (!name || !dossage) {
    alert('Por favor completa el nombre y la dosis.');
    return;
  }

  const btn = document.getElementById('btn-save');
  btn.disabled    = true;
  btn.textContent = 'Guardando...';

  try {
    if (medId) {
      // ── MODO EDICIÓN ────────────────────────────────────────
      const { error } = await supabaseClient
        .from('MEDICATION')
        .update({
          name,
          dossage,
          frecuency_per_day: selectedFreq,
          end_date:          endDate   || null,
          comments:          comments  || null
        })
        .eq('id', medId);

      if (error) throw error;

    } else {
      // ── MODO NUEVO ──────────────────────────────────────────
      const { error } = await supabaseClient
        .from('MEDICATION')
        .insert({
          name,
          dossage,
          frecuency_per_day: selectedFreq,
          start_date:        new Date().toISOString(),
          end_date:          endDate   || null,
          comments:          comments  || null,
          patient_id:        patientId,
          caregiver_id:      getCaregiverId()
        });

      if (error) throw error;
    }

    // Limpia sessionStorage y vuelve a la lista
    sessionStorage.removeItem('modal_med_id');
    sessionStorage.removeItem('modal_patient_id');
    location.href = '../medicacion-cuidador/index.html';

  } catch (err) {
    console.error('saveMedication:', err);
    alert('No se pudo guardar el medicamento. Inténtalo de nuevo.');
    btn.disabled    = false;
    btn.textContent = 'Guardar';
  }
}