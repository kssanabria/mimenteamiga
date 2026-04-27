// ============================================================
//  MI MENTE AMIGA — REGISTRO PACIENTE · script.js
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

// ── Referencias a los campos ──────────────────────────────────
const form          = document.querySelector('form');
const inputNombre   = document.querySelector('input[type="text"]');
const inputFecha    = document.querySelector('input[type="date"]');
const inputEmail    = document.querySelector('input[type="email"]');
const inputPassword = document.querySelectorAll('input[type="password"]')[0];
const inputConfirm  = document.querySelectorAll('input[type="password"]')[1];
const btnCancelar   = document.querySelector('.boton-cancelar');
const btnCrear      = document.querySelector('.boton-crear');

// ── Utilidades ────────────────────────────────────────────────
function showError(message) {
  const prev = document.getElementById('error-msg');
  if (prev) prev.remove();
  const el = document.createElement('p');
  el.id = 'error-msg';
  el.textContent = message;
  el.style.cssText = 'color:#e05252; font-weight:700; text-align:center; margin-top:8px; font-size:0.9rem;';
  document.querySelector('.botones').insertAdjacentElement('beforebegin', el);
}

function clearError() {
  const prev = document.getElementById('error-msg');
  if (prev) prev.remove();
}

// ── Validaciones ──────────────────────────────────────────────
function validateForm() {
  const nombre   = inputNombre.value.trim();
  const fecha    = inputFecha.value;
  const email    = inputEmail.value.trim();
  const password = inputPassword.value;
  const confirm  = inputConfirm.value;

  if (!nombre)             { showError('Por favor ingresa el nombre completo del paciente.'); return false; }
  if (!fecha)              { showError('Por favor ingresa la fecha de nacimiento.'); return false; }
  if (!email)              { showError('Por favor ingresa el correo electrónico.'); return false; }
  if (!password)           { showError('Por favor ingresa una contraseña.'); return false; }
  if (password.length < 6) { showError('La contraseña debe tener al menos 6 caracteres.'); return false; }
  if (password !== confirm) { showError('Las contraseñas no coinciden.'); return false; }

  return true;
}

// ── Registro ──────────────────────────────────────────────────
async function registerPatient(e) {
  e.preventDefault();
  clearError();

  if (!validateForm()) return;

  // Guarda todo ANTES de hacer signUp
  const caregiverId        = storage.get('caregiver_id');
  const tokenBackup        = storage.get('token');
  const refreshTokenBackup = storage.get('refresh_token');

  if (!caregiverId) {
    showError('No hay una sesión de cuidador activa. Inicia sesión primero.');
    return;
  }

  btnCrear.disabled    = true;
  btnCrear.textContent = 'Creando cuenta...';

  try {
    // PASO 1: Crea el usuario del paciente en Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email:    inputEmail.value.trim(),
      password: inputPassword.value,
      options: { data: { role: 'patient' } }
    });

    if (authError) {
      console.error('Error Auth:', authError);
      showError(authError.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
      return;
    }

    console.log('✅ Paciente creado en Auth:', authData.user.id);

    // PASO 2: Restaura datos del cuidador inmediatamente
    storage.set('caregiver_id',  caregiverId);
    storage.set('token',         tokenBackup);
    storage.set('refresh_token', refreshTokenBackup);
    storage.set('role',          'caregiver');

    console.log('✅ Datos cuidador restaurados');

    // PASO 3: Inserta el perfil del paciente
    const { data: profileData, error: profileError } = await supabaseClient
      .from('PATIENT_PROFILE')
      .insert({
        user_id:      authData.user.id,
        caregiver_id: caregiverId,
        full_name:    inputNombre.value.trim(),
        birth_date:   inputFecha.value,
        phone:        null
      })
      .select('id, full_name')
      .single();

    if (profileError) {
      console.error('Error perfil:', profileError);
      showError('Cuenta creada pero error al guardar el perfil. Inténtalo de nuevo.');
      return;
    }

    console.log('✅ Perfil paciente creado:', profileData);

    // PASO 4: Redirige al panel de pacientes del cuidador
    alert(`Paciente ${profileData.full_name} registrado correctamente.`);
    location.href = '../pacientes-cuidador/index.html';

  } catch (err) {
    console.error('registerPatient:', err);
    showError('Error de conexión. Verifica tu internet e inténtalo de nuevo.');
  } finally {
    btnCrear.disabled    = false;
    btnCrear.textContent = 'Crear cuenta';
  }
}

// ── Cancelar ─────────────────────────────────────────────────
function handleCancel(e) {
  e.preventDefault();
  location.href = '../pacientes-cuidador/index.html';
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!storage.get('caregiver_id')) {
    location.href = '../hu-02-login-cuidador/index.html';
    return;
  }

  btnCrear.type    = 'submit';
  btnCancelar.type = 'button';
  form.addEventListener('submit', registerPatient);
  btnCancelar.addEventListener('click', handleCancel);
});