/* ============================================
   Login Screen
   Padanan terus dengan _LoginScreenState (Flutter)
   ============================================ */

// ---- Padanan _handleGoogleLogin() ----
// NOTA: versi web sahaja (padanan cawangan kIsWeb dalam Flutter) —
// tiada redirect custom URL scheme sebab web tak perlukannya.
async function handleGoogleLogin() {
  const btn = document.getElementById('google-signin-btn');
  btn.disabled = true;
  document.getElementById('google-signin-label').style.display = 'none';
  document.getElementById('google-signin-icon').style.display = 'none';
  document.getElementById('google-signin-spinner').style.display = 'inline-block';

  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Padanan Uri.base.origin — balik ke login.html semula lepas Google
        // redirect; initAuthGate() akan detect session baru & auto-redirect
        // ke dashboard yang betul ikut role (lihat js/auth-gate.js).
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
    // Tak perlu redirect manual — Supabase akan bawa ke Google punya
    // consent screen, lepas tu redirect balik guna redirectTo di atas.
  } catch (err) {
    alert('Ralat Log Masuk Google: ' + err.message);
    btn.disabled = false;
    document.getElementById('google-signin-label').style.display = 'inline';
    document.getElementById('google-signin-icon').style.display = 'inline';
    document.getElementById('google-signin-spinner').style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('google-signin-btn').addEventListener('click', handleGoogleLogin);
});