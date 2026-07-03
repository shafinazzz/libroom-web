/* ============================================
   User Dashboard
   Padanan terus dengan _UserDashboardState (Flutter)
   ============================================ */

let dashboardSpaces = [];
let selectedDate = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
let selectedSession = 'Half Day';
let guestCategory = null; // 'agensi' / 'swasta' — null = belum pilih (padanan _guestCategory)

function getDashboardRole() {
  const params = new URLSearchParams(window.location.search);
  return params.get('role') ?? 'guest';
}
const dashboardRole = getDashboardRole();

// ---- Padanan _effectiveCategory getter ----
function effectiveCategory() {
  return dashboardRole === 'upsi' ? 'upsi' : guestCategory;
}

// ---- Padanan categoryLabel() dari cart_manager.dart ----
function categoryLabel(category) {
  if (category === 'upsi') return 'UPSI Staff/Student';
  if (category === 'agensi') return 'Agensi';
  if (category === 'swasta') return 'Swasta';
  return category;
}

// ---- Padanan _categoryLabel getter ----
function categoryLabelDisplay() {
  if (dashboardRole === 'upsi') return 'UPSI Staff/Student';
  if (guestCategory === null) return 'Sila pilih kategori →';
  return categoryLabel(guestCategory);
}

function formatDateDashboard(isoStr) {
  const d = new Date(isoStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function escapeHtmlDashboard(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---- Padanan _rateFor() ----
function rateFor(space) {
  const category = effectiveCategory() ?? 'swasta'; // fallback selamat
  const isHalf = selectedSession === 'Half Day';

  let value;
  if (category === 'upsi') {
    value = isHalf ? space.rate_upsi_half : space.rate_upsi_full;
  } else if (category === 'agensi') {
    value = isHalf ? space.rate_agensi_half : space.rate_agensi_full;
  } else {
    value = isHalf ? space.rate_swasta_half : space.rate_swasta_full;
  }
  return Number(value ?? 0);
}

// ---- Padanan _searchSpaces() ----
async function searchDashboardSpaces() {
  setDashboardSearching(true);
  try {
    const { data: spacesData, error: spacesErr } = await supabaseClient
      .from('spaces')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (spacesErr) throw spacesErr;

    const { data: bookedData, error: bookedErr } = await supabaseClient
      .from('bookings')
      .select('space_id')
      .eq('booking_date', selectedDate)
      .eq('status', 'approved');
    if (bookedErr) throw bookedErr;

    const bookedSpaceIds = new Set((bookedData ?? []).map((b) => String(b.space_id)));
    dashboardSpaces = (spacesData ?? []).filter((s) => !bookedSpaceIds.has(String(s.id)));

    renderDashboardSpaces();
  } catch (err) {
    alert('Ralat ambil senarai bilik: ' + err.message);
    console.error(err);
  } finally {
    setDashboardSearching(false);
  }
}

function setDashboardSearching(isLoading) {
  const btn = document.getElementById('search-btn');
  btn.disabled = isLoading;
  document.getElementById('search-btn-label').style.display = isLoading ? 'none' : 'inline';
  document.getElementById('search-btn-spinner').style.display = isLoading ? 'inline-block' : 'none';

  document.getElementById('space-results').style.display = isLoading ? 'none' : 'block';
  document.getElementById('space-loading').style.display = isLoading ? 'block' : 'none';
}

// ---- Padanan ..._spaces.map((space) => Card(ListTile(...))) ----
function renderDashboardSpaces() {
  const container = document.getElementById('space-results');

  if (dashboardSpaces.length === 0) {
    container.innerHTML = `<div class="space-empty">Tiada bilik dijumpai.</div>`;
    return;
  }

  container.innerHTML = dashboardSpaces.map((space, index) => {
    const rate = rateFor(space);
    const firstImage = (space.image_urls ?? [])[0];

    const thumbHtml = firstImage
      ? `<img class="space-list-item__thumb" src="${firstImage}" alt="${escapeHtmlDashboard(space.name)}"
           onerror="this.replaceWith(Object.assign(document.createElement('div'), {
             className: 'space-list-item__thumb-placeholder',
             innerHTML: '<span class=&quot;material-symbols-outlined&quot;>meeting_room</span>'
           }))" />`
      : `<div class="space-list-item__thumb-placeholder"><span class="material-symbols-outlined">meeting_room</span></div>`;

    return `
      <div class="space-list-item">
        ${thumbHtml}
        <div class="space-list-item__body">
          <p class="space-list-item__title">${escapeHtmlDashboard(space.name ?? '')}</p>
          <p class="space-list-item__subtitle">RM ${rate.toFixed(2)} / ${selectedSession}</p>
        </div>
        <button class="space-list-item__view-btn" data-space-index="${index}">View</button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-space-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openSpaceDetailSheet(dashboardSpaces[Number(btn.dataset.spaceIndex)]);
    });
  });
}

// ============================================
// Space Detail Bottom Sheet — padanan _openSpaceDetail()
// ============================================
function openSpaceDetailSheet(space) {
  // Guest wajib pilih kategori dulu
  if (dashboardRole === 'guest' && guestCategory === null) {
    showToastDashboard('Sila pilih Kategori (Agensi/Swasta) dahulu di atas.');
    return;
  }

  const rate = rateFor(space);
  const images = (space.image_urls ?? []).map(String);
  const overlay = document.getElementById('sheet-overlay');

  const imagesHtml = images.length > 0
    ? `<div class="sheet-image-strip">${images.map((url) => `
        <img src="${url}" alt="${escapeHtmlDashboard(space.name)}"
          onerror="this.replaceWith(Object.assign(document.createElement('div'), {
            className: 'sheet-image-strip__placeholder',
            innerHTML: '<span class=&quot;material-symbols-outlined&quot;>meeting_room</span>'
          }))" />
      `).join('')}</div>`
    : '';

  overlay.innerHTML = `
    <div class="bottom-sheet">
      ${imagesHtml}
      <p class="sheet-title">${escapeHtmlDashboard(space.name ?? '')}</p>
      <p class="sheet-capacity">Max: ${escapeHtmlDashboard(space.capacity ?? '-')}</p>
      <hr class="sheet-divider" />
      <p class="sheet-section-heading">Kelengkapan Makmal/Bilik:</p>
      <p class="sheet-facilities">${escapeHtmlDashboard(space.facilities ?? '-')}</p>
      <hr class="sheet-divider" />
      <p class="sheet-section-heading">Ringkasan Masa &amp; Kadar Harga:</p>
      <div class="sheet-summary-row"><span class="sheet-summary-row__label">Tarikh Terpilih:</span><span class="sheet-summary-row__value">${formatDateDashboard(selectedDate)}</span></div>
      <div class="sheet-summary-row"><span class="sheet-summary-row__label">Sesi Waktu:</span><span class="sheet-summary-row__value">${selectedSession}</span></div>
      <div class="sheet-summary-row"><span class="sheet-summary-row__label">Kategori:</span><span class="sheet-summary-row__value">${escapeHtmlDashboard(categoryLabelDisplay())}</span></div>
      <div class="sheet-summary-row"><span class="sheet-summary-row__label">Kadar Pakej:</span><span class="sheet-summary-row__value">RM ${rate.toFixed(2)} / ${selectedSession}</span></div>

      <div class="sheet-total-row">
        <span class="sheet-total-row__label">Jumlah Anggaran:</span>
        <span class="sheet-total-row__value">RM ${rate.toFixed(2)}</span>
      </div>

      <button class="sheet-add-cart-btn" id="sheet-add-cart-btn">Tambah Kedalam Cart</button>
    </div>
  `;
  overlay.classList.add('open');

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });

  document.getElementById('sheet-add-cart-btn').addEventListener('click', () => {
    try {
      const category = effectiveCategory();
      if (!category) throw new Error('Kategori belum dipilih.');

      CartManager.add({
        spaceId: String(space.id),
        spaceName: space.name ?? '',
        date: selectedDate,
        session: selectedSession,
        category,
        price: rate,
      });

      overlay.classList.remove('open');
      showToastDashboard('Ditambah ke dalam cart!');
    } catch (err) {
      showToastDashboard('Ralat tambah ke cart: ' + err.message);
    }
  });
}

// Toast ringkas (fallback alert kalau toast.js tak dimuatkan)
function showToastDashboard(message) {
  if (typeof showToast === 'function') {
    showToast(message);
  } else {
    alert(message);
  }
}

function updateCartBadge() {
  const count = CartManager.getItems().length;
  const badge = document.getElementById('cart-badge');
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // ---- Init tarikh input ----
  const dateInput = document.getElementById('date-input');
  dateInput.value = selectedDate;
  dateInput.min = new Date().toISOString().split('T')[0];
  document.getElementById('date-value-display').textContent = formatDateDashboard(selectedDate);

  document.getElementById('date-filter-row').addEventListener('click', () => {
    dateInput.showPicker?.() ?? dateInput.click();
  });
  dateInput.addEventListener('change', (e) => {
    selectedDate = e.target.value;
    document.getElementById('date-value-display').textContent = formatDateDashboard(selectedDate);
  });

  // ---- Category filter (guest sahaja) ----
  if (dashboardRole === 'guest') {
    document.getElementById('category-filter-guest').style.display = 'flex';
    document.getElementById('category-filter-upsi').style.display = 'none';

    document.getElementById('guest-category-select').addEventListener('change', (e) => {
      guestCategory = e.target.value || null;
    });
  } else {
    document.getElementById('category-filter-guest').style.display = 'none';
    document.getElementById('category-filter-upsi').style.display = 'flex';
    document.getElementById('category-upsi-display').textContent = categoryLabelDisplay();
  }

  // ---- Session dropdown ----
  document.getElementById('session-select').addEventListener('change', (e) => {
    selectedSession = e.target.value;
  });

  // ---- Search button ----
  document.getElementById('search-btn').addEventListener('click', searchDashboardSpaces);

  // ---- Cart icon (appbar) ----
  updateCartBadge();
  CartManager.onChange(updateCartBadge);
  document.getElementById('cart-btn').addEventListener('click', () => {
    window.location.href = `booking.html?role=${dashboardRole}`;
  });

  // ---- Padanan UserDrawer(role: widget.role) ----
  renderUserDrawer('drawer-container', dashboardRole);
  document.getElementById('drawer-menu-btn').addEventListener('click', openUserDrawer);

  // Padanan checkAndShowAnnouncements(context) — WidgetsBinding.addPostFrameCallback
  checkAndShowAnnouncements();

  // ---- Padanan AppBottomNav(role, currentIndex: 0) ----
  renderAppBottomNav('bottom-nav-container', dashboardRole, 0);

  // Search awal (padanan initState -> _searchSpaces())
  searchDashboardSpaces();
});