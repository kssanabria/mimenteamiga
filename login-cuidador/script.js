// ============================================================
//  MI MENTE AMIGA — LOGIN CUIDADOR · script.js
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
const inputEmail    = document.querySelector('input[type="email"]');
const inputPassword = document.querySelector('input[type="password"]');
const btnLogin      = document.querySelector('.boton-enviar');

// ── Utilidades ────────────────────────────────────────────────
function showError(message) {
  const prev = document.getElementById('error-msg');
  if (prev) prev.remove();

  const el = document.createElement('p');
  el.id = 'error-msg';
  el.textContent = message;
  el.style.cssText = 'color:#e05252; font-weight:700; text-align:center; margin-top:8px; font-size:0.9rem;';
  btnLogin.insertAdjacentElement('afterend', el);
}

function clearError() {
  const prev = document.getElementById('error-msg');
  if (prev) prev.remove();
}

// ── Validaciones ──────────────────────────────────────────────
function validateForm() {
  const email    = inputEmail.value.trim();
  const password = inputPassword.value;

  if (!email)    { showError('Por favor ingresa tu correo electrónico.'); return false; }
  if (!password) { showError('Por favor ingresa tu contraseña.'); return false; }

  return true;
}

// ── Login ─────────────────────────────────────────────────────
async function loginCaregiver(e) {
  e.preventDefault();
  clearError();

  if (!validateForm()) return;

  btnLogin.disabled    = true;
  btnLogin.textContent = 'Entrando...';

  try {
    // 1. Login con Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email:    inputEmail.value.trim(),
      password: inputPassword.value
    });

    if (authError) {
      showError('Correo o contraseña incorrectos.');
      return;
    }

    // 2. Verifica que el usuario sea un cuidador
    const { data: caregiverData, error: caregiverError } = await supabaseClient
      .from('CAREGIVER_PROFILE')
      .select('id, full_name')
      .eq('user_id', authData.user.id) // busca su perfil usando el id del logueado
      .single();

    if (caregiverError || !caregiverData) {
      await supabaseClient.auth.signOut(); // cierra sesión si no es cuidador
      showError('Esta cuenta no corresponde a un cuidador.');
      return;
    }

    // 3. Guarda datos de sesión en localStorage
    storage.set('token',        authData.session.access_token);
    storage.set('caregiver_id', caregiverData.id);
    storage.set('role',         'caregiver');

    // 4. Redirige al panel del cuidador
    location.href = '../panel-principal-cuidador/index.html';

  } catch (err) {
    console.error('loginCaregiver:', err);
    showError('Error de conexión. Verifica tu internet e inténtalo de nuevo.');
  } finally {
    btnLogin.disabled    = false;
    btnLogin.textContent = 'Entrar';
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  btnLogin.type = 'submit';

  const linkRegistro = document.querySelector('.p-final a');
  if (linkRegistro) linkRegistro.href = '../registro-cuidador/index.html';

  form.addEventListener('submit', loginCaregiver);
});