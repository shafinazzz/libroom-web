/* ============================================
   Admin Drawer
   Padanan terus dengan AdminDrawer (Flutter)
   ============================================ */

const DRAWER_NAV_ITEMS = [
  { icon: 'dashboard',    label: 'Dashboard',               page: 'admin_dashboard.html' },
  { icon: 'meeting_room', label: 'Space Management',        page: 'space_management.html' },
  { icon: 'fact_check',   label: 'Reservation Management',  page: 'reservation_management.html', badge: true },
  { icon: 'payments',     label: 'Payment Management',      page: 'payment_management.html' },
  { icon: 'campaign',     label: 'Announcement',            page: 'announcement_management.html' },
];

/**
 * Render drawer + overlay + modal-modal ke dalam elemen container.
 * @param {string} containerId
 */
function renderAdminDrawer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pendingCount = PendingBookingNotifier.getCount();

  const navItemsHtml = DRAWER_NAV_ITEMS.map((item) => {
    const badgeHtml = item.badge && pendingCount > 0
      ? `<span class="admin-drawer__item-badge">${pendingCount}</span>`
      : '';
    return `
      <button class="admin-drawer__item" data-page="${item.page}">
        <span class="material-symbols-outlined">${item.icon}</span>
        <span>${item.label}</span>
        ${badgeHtml}
      </button>
    `;
  }).join('');

  container.innerHTML = `
    <div class="drawer-overlay" id="drawer-overlay"></div>

    <aside class="admin-drawer" id="admin-drawer">
      <div class="admin-drawer__header">
        <span class="material-symbols-outlined">admin_panel_settings</span>
        <h2>Libroom Administrator</h2>
        <p>System</p>
      </div>

      <nav class="admin-drawer__nav">
        ${navItemsHtml}
        <button class="admin-drawer__item" id="drawer-about-btn">
          <span class="material-symbols-outlined">info</span>
          <span>About</span>
        </button>
      </nav>

      <hr class="admin-drawer__divider" />
      <div class="admin-drawer__footer">
        <button class="admin-drawer__logout-btn" id="drawer-logout-btn">
          <span class="material-symbols-outlined">logout</span>
          Log Out
        </button>
      </div>
    </aside>

    <!-- Modal: confirm logout -->
    <div class="modal-overlay" id="logout-modal-overlay">
      <div class="modal-box modal-box--confirm">
        <h3>Log Keluar</h3>
        <p>Anda pasti mahu log keluar?</p>
        <div class="modal-actions">
          <button id="logout-cancel-btn">Batal</button>
          <button id="logout-confirm-btn">Log Keluar</button>
        </div>
      </div>
    </div>

    <!-- Modal: about -->
    <div class="modal-overlay" id="about-modal-overlay">
      <div class="modal-box modal-box--about">
        <div class="about-header">
          <button class="about-header__close" id="about-close-btn" aria-label="Tutup">
            <span class="material-symbols-outlined">close</span>
          </button>
          <span class="material-symbols-outlined">local_library</span>
          <h3>LIBROOM RESERVATION SYSTEM</h3>
          <p>Perpustakaan Tuanku Bainun, UPSI</p>
        </div>
        <div class="about-body">
          <h4>Tentang Sistem</h4>
          <p>LibRoom adalah sistem tempahan bilik dalam talian untuk Perpustakaan Tuanku Bainun, UPSI. Sistem ini membolehkan pengguna (staf, pelajar UPSI dan orang awam) membuat tempahan bilik, seminar, auditorium dan ruang lain secara digital. Admin perpustakaan boleh mengurus tempahan, meluluskan/menolak permohonan dan menjana laporan bulanan.</p>

          <h4>Tentang WBL</h4>
          <p>Work Based Learning (WBL) adalah pendekatan pembelajaran yang menggabungkan teori akademik dengan pengalaman kerja sebenar di industri. Sistem LibRoom ini dibangunkan merangkumi tiga skop utama:

1. Reka Bentuk Pembangunan Aplikasi Mudah Alih - sistem tempahan bilik berasaskan Flutter untuk platform Android dan web.

2. Pengaturcaraan Web untuk Sistem Maklumat - platform web yang boleh diakses secara dalam talian pada bila-bila masa.

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
DTD3053 - Pengaturcaraan Web untuk Sistem Maklumat
DTB3013 - Keusahawanan Digital</p>
            </div>
          </div>
          <div class="about-info-row">
            <span class="material-symbols-outlined">person</span>
            <div>
              <p class="about-info-row__label">Pensyarah</p>
              <p class="about-info-row__value">En. Rasyidi Bin Johan
Prof. Madya Dr. Aslina Binti Saad
Dr. Norhisham Bin Mohamad Nordin</p>
            </div>
          </div>

          <div style="height:16px"></div>

          <div class="about-faculty-row">
            <img class="about-faculty-row__logo" src="../assets/faculty_logo.png" alt="Logo Fakulti"
              onerror="this.replaceWith(Object.assign(document.createElement('div'), {
                className: 'about-faculty-row__logo-fallback',
                innerHTML: '<span class=&quot;material-symbols-outlined&quot;>school</span>'
              }))" />
            <p class="about-faculty-row__name">Fakulti Komputeran dan Meta-Teknologi<br>Universiti Pendidikan Sultan Idris</p>
          </div>
        </div>
        <div class="about-copyright">© 2026 Fakulti Komputeran dan Meta-Teknologi (FKMT), UPSI. Hak Cipta Terpelihara.</div>
        <div class="about-footer">
          <button id="about-footer-close-btn">Tutup</button>
        </div>
      </div>
    </div>
  `;

  wireDrawerEvents();
}

/**
 * Daftar drawer supaya badge auto-update bila pending count berubah —
 * padanan ValueListenableBuilder. Preserve status buka/tutup drawer semasa re-render.
 */
function syncAdminDrawerBadge(containerId) {
  renderAdminDrawer(containerId); // render kali pertama

  PendingBookingNotifier.onChange(() => {
    const wasOpen = document.getElementById('admin-drawer')?.classList.contains('open');
    renderAdminDrawer(containerId);
    if (wasOpen) openDrawer();
  });
}

function wireDrawerEvents() {
  const drawer = document.getElementById('admin-drawer');
  const overlay = document.getElementById('drawer-overlay');

  overlay.addEventListener('click', closeDrawer);

  // Padanan _goTo() — Navigator.pop + pushReplacement
  drawer.querySelectorAll('.admin-drawer__item[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = btn.dataset.page;
    });
  });

  // ---- About dialog ----
  const aboutOverlay = document.getElementById('about-modal-overlay');
  document.getElementById('drawer-about-btn').addEventListener('click', () => {
    closeDrawer();
    aboutOverlay.classList.add('open');
  });
  document.getElementById('about-close-btn').addEventListener('click', () => aboutOverlay.classList.remove('open'));
  document.getElementById('about-footer-close-btn').addEventListener('click', () => aboutOverlay.classList.remove('open'));
  aboutOverlay.addEventListener('click', (e) => {
    if (e.target === aboutOverlay) aboutOverlay.classList.remove('open');
  });

  // ---- Logout confirm dialog ----
  const logoutOverlay = document.getElementById('logout-modal-overlay');
  document.getElementById('drawer-logout-btn').addEventListener('click', () => {
    logoutOverlay.classList.add('open');
  });
  document.getElementById('logout-cancel-btn').addEventListener('click', () => logoutOverlay.classList.remove('open'));
  document.getElementById('logout-confirm-btn').addEventListener('click', async () => {
    logoutOverlay.classList.remove('open');
    await performLogout();
  });
}

// ---- Padanan _logout() ----
async function performLogout() {
  PendingBookingNotifier.stop();
  await supabaseClient.auth.signOut();
  // Padanan Navigator.pushAndRemoveUntil(... AuthGate ...)
  window.location.href = '../index.html';
}

function openDrawer() {
  document.getElementById('admin-drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
}

function closeDrawer() {
  document.getElementById('admin-drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
}