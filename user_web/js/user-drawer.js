/* ============================================
   User Drawer
   Padanan terus dengan UserDrawer (Flutter)
   ============================================ */

const USER_DRAWER_NAV_ITEMS = [
  { icon: 'home',            label: 'Home',    page: 'user_dashboard.html' },
  { icon: 'bookmark_border', label: 'Spaces',  page: 'spaces.html' },
  { icon: 'shopping_bag',    label: 'Booking', page: 'booking.html' },
  { icon: 'receipt_long',    label: 'History', page: 'history.html' },
  { icon: 'person',          label: 'Profile', page: 'profile.html' },
];

// ---- Padanan _roleLabel getter ----
function userDrawerRoleLabel(role) {
  return role === 'upsi' ? 'UPSI Staff/Student' : 'Orang Luar (Guest)';
}

/**
 * Render drawer + overlay + modal-modal ke dalam elemen container.
 * @param {string} containerId
 * @param {string} role
 */
async function renderUserDrawer(containerId, role) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { data } = await supabaseClient.auth.getUser();
  const user = data?.user;
  const fullName = user?.user_metadata?.full_name;
  const email = user?.email ?? '';

  const navItemsHtml = USER_DRAWER_NAV_ITEMS.map((item) => `
    <button class="user-drawer__item" data-page="${item.page}">
      <span class="material-symbols-outlined">${item.icon}</span>
      <span>${item.label}</span>
    </button>
  `).join('');

  container.innerHTML = `
    <div class="drawer-overlay" id="user-drawer-overlay"></div>

    <aside class="user-drawer" id="user-drawer">
      <div class="user-drawer__header">
        <div class="user-drawer__avatar">
          <span class="material-symbols-outlined">person</span>
        </div>
        <p class="user-drawer__name">${escapeHtmlUserDrawer(fullName || 'Pengguna')}</p>
        <p class="user-drawer__email">${escapeHtmlUserDrawer(email)}</p>
        <span class="user-drawer__role-badge">${userDrawerRoleLabel(role)}</span>
      </div>

      <nav class="user-drawer__nav">
        ${navItemsHtml}
        <button class="user-drawer__item" id="user-drawer-about-btn">
          <span class="material-symbols-outlined">info</span>
          <span>About</span>
        </button>
      </nav>

      <hr class="user-drawer__divider" />
      <div class="user-drawer__footer">
        <button class="user-drawer__logout-btn" id="user-drawer-logout-btn">
          <span class="material-symbols-outlined">logout</span>
          Log Out
        </button>
      </div>
    </aside>

    <!-- Modal: confirm logout -->
    <div class="modal-overlay" id="user-logout-modal-overlay">
      <div class="modal-box">
        <h3>Log Keluar</h3>
        <p>Anda pasti mahu log keluar?</p>
        <div class="modal-actions">
          <button id="user-logout-cancel-btn">Batal</button>
          <button class="primary" id="user-logout-confirm-btn">Log Keluar</button>
        </div>
      </div>
    </div>

    <!-- Modal: about -->
    <div class="modal-overlay" id="user-about-modal-overlay">
      <div class="modal-box" style="padding:0;">
        <div class="about-header">
          <button class="about-header__close" id="user-about-close-btn" aria-label="Tutup">
            <span class="material-symbols-outlined">close</span>
          </button>
          <span class="material-symbols-outlined">local_library</span>
          <h3>LIBROOM RESERVATION SYSTEM</h3>
          <p>Perpustakaan Tuanku Bainun, UPSI</p>
        </div>
        <div class="about-body">
          <h4>Tentang Sistem</h4>
          <p>LibRoom adalah sistem tempahan bilik dalam talian untuk Perpustakaan Tuanku Bainun, UPSI. Sistem ini membolehkan pengguna (staf, pelajar UPSI dan orang awam) membuat tempahan bilik, seminar, auditorium dan ruang lain secara digital. Admin perpustakaan boleh mengurus tempahan, meluluskan/menolak permohonan, dan menjana laporan bulanan.</p>

          <h4>Tentang WBL</h4>
          <p>Work Based Learning (WBL) adalah pendekatan pembelajaran yang menggabungkan teori akademik dengan pengalaman kerja sebenar di industri. Sistem LibRoom ini dibangunkan merangkumi tiga skop utama:

1. Pembangunan Aplikasi Mudah Alih - sistem tempahan bilik berasaskan Flutter untuk platform Android dan web.

2. Pembangunan Web - platform web yang boleh diakses secara dalam talian pada bila-bila masa.

3. Keusahawanan Digital - sistem ini mengaplikasikan konsep perniagaan digital termasuk pengurusan tempahan, pembayaran dalam talian, dan penjanaan laporan untuk keperluan operasi perpustakaan.</p>

          <h4>Dibangunkan Oleh</h4>
          <div class="about-dev-row">
            <span class="about-dev-row__num">1.</span>
            <div>
              <p class="about-dev-row__name">Nurul Shafinaz Binti Azri</p>
              <p class="about-dev-row__id">D20231106533</p>
            </div>
          </div>
          <div class="about-dev-row">
            <span class="about-dev-row__num">2.</span>
            <div>
              <p class="about-dev-row__name">Fatin Syahirah Binti Yuni Azuar</p>
              <p class="about-dev-row__id">D20231106524</p>
            </div>
          </div>
          <div class="about-dev-row">
            <span class="about-dev-row__num">3.</span>
            <div>
              <p class="about-dev-row__name">Khairunnisa Binti Hosdi</p>
              <p class="about-dev-row__id">D20231106503</p>
            </div>
          </div>

          <div style="height:16px"></div>

          <div class="about-info-row">
            <span class="material-symbols-outlined">book</span>
            <div>
              <p class="about-info-row__label">Subjek</p>
              <p class="about-info-row__value">DTS3073 - Reka Bentuk Pembangunan Aplikasi Mudah Alih
DTD3053 - Web Programming
DTB3013 - Keusahawanan Digital</p>
            </div>
          </div>
          <div class="about-info-row">
            <span class="material-symbols-outlined">person</span>
            <div>
              <p class="about-info-row__label">Pensyarah</p>
              <p class="about-info-row__value">Mr. Rasyidi Bin Johan
Prof. Madya Dr. Aslina Binti Saad
Dr. Norhisham Bin Mohamad Nordin</p>
            </div>
          </div>
        </div>
        <div class="about-footer">
          <button id="user-about-footer-close-btn">Tutup</button>
        </div>
      </div>
    </div>
  `;

  wireUserDrawerEvents(role);
}

function wireUserDrawerEvents(role) {
  const drawer = document.getElementById('user-drawer');
  const overlay = document.getElementById('user-drawer-overlay');

  overlay.addEventListener('click', closeUserDrawer);

  // Padanan _goTo() — Navigator.pop + pushReplacement, role dikekalkan
  drawer.querySelectorAll('.user-drawer__item[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = `${btn.dataset.page}?role=${role}`;
    });
  });

  // ---- About dialog ----
  const aboutOverlay = document.getElementById('user-about-modal-overlay');
  document.getElementById('user-drawer-about-btn').addEventListener('click', () => {
    closeUserDrawer();
    aboutOverlay.classList.add('open');
  });
  document.getElementById('user-about-close-btn').addEventListener('click', () => aboutOverlay.classList.remove('open'));
  document.getElementById('user-about-footer-close-btn').addEventListener('click', () => aboutOverlay.classList.remove('open'));
  aboutOverlay.addEventListener('click', (e) => {
    if (e.target === aboutOverlay) aboutOverlay.classList.remove('open');
  });

  // ---- Logout confirm dialog ----
  const logoutOverlay = document.getElementById('user-logout-modal-overlay');
  document.getElementById('user-drawer-logout-btn').addEventListener('click', () => {
    logoutOverlay.classList.add('open');
  });
  document.getElementById('user-logout-cancel-btn').addEventListener('click', () => logoutOverlay.classList.remove('open'));
  document.getElementById('user-logout-confirm-btn').addEventListener('click', async () => {
    logoutOverlay.classList.remove('open');
    await supabaseClient.auth.signOut();
    // Padanan Navigator.pushAndRemoveUntil(... AuthGate ...)
    window.location.replace('../index.html');
  });
}

function openUserDrawer() {
  document.getElementById('user-drawer').classList.add('open');
  document.getElementById('user-drawer-overlay').classList.add('open');
}

function closeUserDrawer() {
  document.getElementById('user-drawer').classList.remove('open');
  document.getElementById('user-drawer-overlay').classList.remove('open');
}

function escapeHtmlUserDrawer(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}