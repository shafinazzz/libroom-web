/* ============================================
   Admin Bottom Navigation
   Padanan terus dengan AdminBottomNav (Flutter)
   ============================================ */

// Senarai tab — padanan dengan switch(index) dalam Dart
const ADMIN_NAV_ITEMS = [
  { icon: 'dashboard',    label: 'Dashboard',    page: 'admin_dashboard.html' },
  { icon: 'meeting_room', label: 'Space',         page: 'space_management.html' },
  { icon: 'fact_check',   label: 'Reservation',   page: 'reservation_management.html' },
  { icon: 'payments',     label: 'Payment',       page: 'payment_management.html' },
  { icon: 'campaign',     label: 'Announce',      page: 'announcement_management.html' },
];

/**
 * Render bottom nav ke dalam elemen container.
 * @param {string} containerId - id elemen tempat nav akan dimasukkan
 * @param {number} currentIndex - 0=Dashboard, 1=Space, 2=Reservation, 3=Payment, 4=Announcement
 */
function renderAdminBottomNav(containerId, currentIndex) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pendingCount = PendingBookingNotifier.getCount();

  const itemsHtml = ADMIN_NAV_ITEMS.map((item, index) => {
    const isActive = index === currentIndex;
    const showBadge = item.label === 'Reservation' && pendingCount > 0;

    return `
      <button
        class="admin-bottom-nav__item ${isActive ? 'active' : ''}"
        data-index="${index}"
        aria-label="${item.label}"
        aria-current="${isActive ? 'page' : 'false'}"
      >
        <span class="admin-bottom-nav__icon">
          <span class="material-symbols-outlined">${item.icon}</span>
          ${showBadge ? `<span class="admin-bottom-nav__badge">${pendingCount}</span>` : ''}
        </span>
        <span class="admin-bottom-nav__label">${item.label}</span>
      </button>
    `;
  }).join('');

  container.innerHTML = `<nav class="admin-bottom-nav">${itemsHtml}</nav>`;

  // Padanan dengan _onTap() + Navigator.pushReplacement()
  container.querySelectorAll('.admin-bottom-nav__item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index);
      if (index === currentIndex) return;
      window.location.href = ADMIN_NAV_ITEMS[index].page;
    });
  });
}

/**
 * Daftar bottom nav supaya auto-render semula bila pending count berubah —
 * padanan terus dengan ValueListenableBuilder reactive (bukan polling lagi).
 * PENTING: js/pending-booking-notifier.js kena dimuatkan SEBELUM fail ini.
 */
function syncAdminBottomNavBadge(containerId, currentIndex) {
  renderAdminBottomNav(containerId, currentIndex); // render kali pertama
  PendingBookingNotifier.onChange(() => renderAdminBottomNav(containerId, currentIndex));
}