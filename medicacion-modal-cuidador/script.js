// ============================================================
//  MI MENTE AMIGA — CUIDADOR / MEDICACIÓN MODAL · script.js
// ============================================================

const API_BASE_URL   = 'http://localhost:3000/api';
const getToken       = () => localStorage.getItem('token');
const getCaregiverId = () => localStorage.getItem('caregiver_id');
const authHeaders    = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// Recuperados desde sessionStorage (guardados en medicacion/script.js)
const patientId = sessionStorage.getItem('modal_patient_id');
const medId     = sessionStorage.getItem('modal_med_id'); // null si es nueva

let selectedFreq = 1;

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (medId) {
    // Modo edición: carga los datos actuales del medicamento
    document.getElementById('modal-title').textContent = 'Editar Medicación';
    await loadMedicationData(medId);
  } else {
    // Modo nuevo: renderiza 1 hora de toma por defecto
    renderTimeInputs(1, []);
  }
});

// ── Cargar datos del medicamento (modo edición) ───────────────
/**
 * GET /medications/:id
 * Respuesta esperada: {
 *   id, name, dosage, frecuency_per_day,
 *   schedule: ['08:00', '14:00'],
 *   end_date, comentarios
 * }
 */
async function loadMedicationData(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/medications/${id}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error();
    const med = await res.json();

    document.getElementById('med-name').value         = med.name        || '';
    document.getElementById('med-dosage').value       = med.dosage      || '';
    document.getElementById('med-end-date').value     = med.end_date    ? med.end_date.slice(0, 10) : '';
    document.getElementById('med-instructions').value = med.comentarios || '';

    const freq    = med.frecuency_per_day || 1;
    const freqBtn = document.querySelector(`.freq-btn[data-freq="${freq}"]`);
    if (freqBtn) selectFrequency(freqBtn);

    renderTimeInputs(freq, med.schedule || []);
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
 * POST /medications          (nuevo)
 * PUT  /medications/:id      (editar)
 * Body: {
 *   patient_id, caregiver_id, name, dosage,
 *   frecuency_per_day, schedule, end_date, comentarios
 * }
 */
async function saveMedication() {
  const name         = document.getElementById('med-name').value.trim();
  const dosage       = document.getElementById('med-dosage').value.trim();
  const endDate      = document.getElementById('med-end-date').value;
  const instructions = document.getElementById('med-instructions').value.trim();
  const schedule     = getScheduleTimes();

  if (!name || !dosage) {
    alert('Por favor completa el nombre y la dosis.');
    return;
  }

  const body = {
    patient_id:        patientId,
    caregiver_id:      getCaregiverId(),
    name,
    dosage,
    frecuency_per_day: selectedFreq,
    schedule,
    end_date:          endDate      || null,
    comentarios:       instructions || null
  };

  const btn = document.getElementById('btn-save');
  btn.disabled    = true;
  btn.textContent = 'Guardando...';

  try {
    const url    = medId
      ? `${API_BASE_URL}/medications/${medId}`
      : `${API_BASE_URL}/medications`;
    const method = medId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Error al guardar medicamento');

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