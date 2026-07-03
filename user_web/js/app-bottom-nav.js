/* ============================================
   App Bottom Navigation (User Side)
   Padanan terus dengan AppBottomNav (Flutter)
   ============================================ */

// Senarai tab — padanan dengan switch(index) dalam Dart
const APP_NAV_ITEMS = [
  { icon: 'home',              label: 'Home',    page: 'user_dashboard.html' },
  { icon: 'bookmark_border',   label: 'Spaces',  page: 'spaces.html' },
  { icon: 'shopping_bag',      label: 'Booking', page: 'booking.html' },
  { icon: 'receipt_long',      label: 'History', page: 'history.html' },
  { icon: 'person',            label: 'Profile', page: 'profile.html' },
];

/**
 * Render bottom nav ke dalam elemen container.
 * @param {string} containerId
 * @param {string} role - 'upsi' atau 'guest', dikekalkan merentasi navigasi
 * @param {number} currentIndex - 0=Home, 1=Spaces, 2=Booking, 3=History, 4=Profile
 */
function renderAppBottomNav(containerId, role, currentIndex) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const itemsHtml = APP_NAV_ITEMS.map((item, index) => {
    const isActive = index === currentIndex;
    return `
      <button
        class="app-bottom-nav__item ${isActive ? 'active' : ''}"
        data-index="${index}"
        aria-label="${item.label}"
        aria-current="${isActive ? 'page' : 'false'}"
      >
        <span class="material-symbols-outlined app-bottom-nav__icon">${item.icon}</span>
        <span class="app-bottom-nav__label">${item.label}</span>
      </button>
    `;
  }).join('');

  container.innerHTML = `<nav class="app-bottom-nav">${itemsHtml}</nav>`;

  // Padanan _onTap() + Navigator.pushReplacement() — role dikekalkan dalam URL
  container.querySelectorAll('.app-bottom-nav__item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index);
      if (index === currentIndex) return;
      window.location.href = `${APP_NAV_ITEMS[index].page}?role=${role}`;
    });
  });
}