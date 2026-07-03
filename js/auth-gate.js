
// ---- Padanan kAdminEmails ----
const K_ADMIN_EMAILS = [
  'shafinazazri1@gmail.com', // <-- TUKAR dengan emel Google admin sebenar
];

// ---- Padanan resolveUserRole() ----
function resolveUserRole(email) {
  const lower = (email ?? '').toLowerCase();
  if (K_ADMIN_EMAILS.includes(lower)) {
    return 'admin';
  } else if (lower.endsWith('upsi.edu.my')) {
    return 'upsi';
  } else {
    return 'guest';
  }
}

// ---- Padanan _syncProfile() ----
async function syncProfile(user, role) {
  try {
    const { error } = await supabaseClient.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name,
      role,
    });
    if (error) console.error('Gagal sync profile:', error.message);
  } catch (err) {
    console.error('Gagal sync profile:', err.message);
  }
}

// ---- Padanan redirect ikut role dalam AuthGate.build() ----
function redirectByRole(role) {
  if (role === 'admin') {
    window.location.replace('admin_web/admin_dashboard.html');
  } else {
    window.location.replace(`user_web/user_dashboard.html?role=${role}`);
  }
}

/**
 * Padanan StreamBuilder<AuthState> dalam AuthGate — semak session semasa
 * load, dan dengar auth state change (lepas Google OAuth redirect balik).
 */
async function initAuthGate() {
  // ---- Cek session sedia ada (padanan Supabase.instance.client.auth.currentSession) ----
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (sessionData?.session) {
    await handleAuthenticated(sessionData.session.user);
    return; // dah redirect, tak perlu papar login card
  }

  // Tiada session — papar login card (padanan return LoginScreen())
  showLoginCard();

  // ---- Dengar perubahan auth state (padanan onAuthStateChange stream) ----
  // Ni akan fire lepas Google OAuth redirect balik ke page ni dengan session baru.
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
      handleAuthenticated(session.user);
    }
  });
}

// ---- Padanan bahagian "final user = session.user; role = resolveUserRole(...)" ----
async function handleAuthenticated(user) {
  const role = resolveUserRole(user.email ?? '');
  await syncProfile(user, role);
  redirectByRole(role);
}

function showLoginCard() {
  document.getElementById('auth-loading').style.display = 'none';
  document.getElementById('login-card-wrap').style.display = 'flex';
}