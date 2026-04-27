// ============================================================
//  MI MENTE AMIGA — REGISTRO CUIDADOR · script.js
// ============================================================

// ── Inicializa Supabase ───────────────────────────────────────
const SUPABASE_URL = 'https://fevgeitgmrmcbxqtxyyw.supabase.co'; // Tu URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldmdlaXRnbXJtY2J4cXR4eXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTYzMjcsImV4cCI6MjA5MjYzMjMyN30.oBygQByRsFpekJdutoGMHFGyDz8cpBi1qPx3Iv2c9kQ';               // Tu anon key
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.warn('localStorage bloqueado:', err);
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn('localStorage bloqueado:', err);
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn('localStorage bloqueado:', err);
    }
  }
};

// ── Referencias a los campos ──────────────────────────────────
const form          = document.querySelector('form');
const inputNombre   = document.querySelector('input[type="text"]');
const inputTelefono = document.querySelector('input[type="phone"]');
const inputFecha    = document.querySelector('input[type="date"]');
const inputEmail    = document.querySelector('input[type="email"]');
const inputPassword = document.querySelectorAll('input[type="password"]')[0];
const inputConfirm  = document.querySelectorAll('input[type="password"]')[1];
const btnCrear      = document.querySelector('button');

// ── Utilidades ────────────────────────────────────────────────
function showError(message) {
  const prev = document.getElementById('error-msg');
  if (prev) prev.remove();

  const el = document.createElement('p');
  el.id = 'error-msg';
  el.textContent = message;
  el.style.cssText = 'color:#e05252; font-weight:700; text-align:center; margin-top:8px; font-size:0.9rem;';
  btnCrear.insertAdjacentElement('afterend', el);
}

function clearError() {
  const prev = document.getElementById('error-msg');
  if (prev) prev.remove();
}

// ── Validaciones ──────────────────────────────────────────────
function validateForm() {
  const nombre   = inputNombre.value.trim();
  const telefono = inputTelefono.value.trim();
  const fecha    = inputFecha.value;
  const email    = inputEmail.value.trim();
  const password = inputPassword.value;
  const confirm  = inputConfirm.value;

  if (!nombre)              { showError('Por favor ingresa tu nombre completo.'); return false; }
  if (!telefono)            { showError('Por favor ingresa tu teléfono.'); return false; }
  if (!fecha)               { showError('Por favor ingresa tu fecha de nacimiento.'); return false; }
  if (!email)               { showError('Por favor ingresa tu correo electrónico.'); return false; }
  if (!password)            { showError('Por favor ingresa una contraseña.'); return false; }
  if (password.length < 6)  { showError('La contraseña debe tener al menos 6 caracteres.'); return false; }
  if (password !== confirm)  { showError('Las contraseñas no coinciden.'); return false; }

  return true;
}

// ── Registro ──────────────────────────────────────────────────
async function registerCaregiver(e) {
  e.preventDefault();
  clearError();

  if (!validateForm()) return;

  btnCrear.disabled    = true;
  btnCrear.textContent = 'Creando cuenta...';

  try {
    // PASO 1: Crea el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email:    inputEmail.value.trim(),
      password: inputPassword.value,
      options: {
        data: {
          role: 'caregiver'  // el trigger lo leerá con new.raw_user_meta_data->>'role'
        }
      }
    });

    if (authError) {
      showError(authError.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
      return;
    }

    // PASO 2: Crea el perfil de cuidador en caregiver_profile
    const { data: profileData, error: profileError } = await supabaseClient
      .from('CAREGIVER_PROFILE')
      .insert({
        user_id:    authData.user.id,         // id del usuario recién creado en Auth
        full_name:  inputNombre.value.trim(),
        telefono:      inputTelefono.value.trim(),
        birth_date: inputFecha.value
      })
      .select('id')  // devuelve el id del perfil creado
      .single();

    if (profileError) {
  console.error('Error completo perfil:', profileError);
  console.error('Código:', profileError.code);
  console.error('Mensaje:', profileError.message);
  console.error('Detalles:', profileError.details);
  showError('Cuenta creada pero error al guardar el perfil. Contacta soporte.');
  return;
}

    // PASO 3: Guarda datos de sesión en localStorage
    storage.set('token',        authData.session.access_token);
    storage.set('caregiver_id', profileData.id);
    storage.set('role',         'caregiver');

    // PASO 4: Redirige al panel del cuidador
    location.href = '../panel-principal-cuidador/index.html';

  } catch (err) {
    console.error('registerCaregiver:', err);
    showError('Error de conexión. Verifica tu internet e inténtalo de nuevo.');
  } finally {
    btnCrear.disabled    = false;
    btnCrear.textContent = 'Crear cuenta';
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  form.addEventListener('submit', registerCaregiver);
});