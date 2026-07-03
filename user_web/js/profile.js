/* ============================================
   Profile Page
   Padanan terus dengan ProfilePage (Flutter)
   ============================================ */

function getProfileRole() {
  const params = new URLSearchParams(window.location.search);
  return params.get('role') ?? 'guest';
}

// ---- Padanan _roleLabel getter ----
function roleLabel(role) {
  if (role === 'upsi') return 'UPSI Staff/Student';
  if (role === 'admin') return 'Admin';
  return 'Orang Luar (Guest)';
}

// ---- Padanan build() — papar avatar, nama, email, role badge ----
async function loadProfile() {
  const { data } = await supabaseClient.auth.getUser();
  const user = data?.user;

  const fullName = user?.user_metadata?.full_name;
  const email = user?.email ?? '-';
  const initial = ((fullName && fullName.length > 0) ? fullName[0]
    : (email && email.length > 0 ? email[0] : '?')).toUpperCase();

  document.getElementById('profile-avatar').textContent = initial;
  document.getElementById('profile-name').textContent = fullName || 'Pengguna';
  document.getElementById('profile-email').textContent = email;
  document.getElementById('profile-role-badge').textContent = roleLabel(getProfileRole());
}

// ---- Padanan _logout() ----
function wireProfileLogout() {
  const overlay = document.getElementById('profile-logout-modal-overlay');

  document.getElementById('profile-logout-btn').addEventListener('click', () => {
    overlay.classList.add('open');
  });

  document.getElementById('profile-logout-cancel-btn').addEventListener('click', () => {
    overlay.classList.remove('open');
  });

  document.getElementById('profile-logout-confirm-btn').addEventListener('click', async () => {
    overlay.classList.remove('open');
    await supabaseClient.auth.signOut();
    // Padanan Navigator.pushAndRemoveUntil(... AuthGate ...) — bersihkan history
    window.location.replace('../index.html');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  wireProfileLogout();
  renderAppBottomNav('bottom-nav-container', getProfileRole(), 4);

  // Padanan UserDrawer
  renderUserDrawer('drawer-container', getProfileRole());
  document.getElementById('drawer-menu-btn').addEventListener('click', openUserDrawer);
});