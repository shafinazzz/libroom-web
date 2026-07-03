/* ============================================
   History Page
   Padanan terus dengan _HistoryPageState (Flutter)
   ============================================ */

let historyBookings = [];

// ---- Padanan bookingRefLabel() dari cart_manager.dart ----
// Format confirmed dari BookingSuccessPage & report_generator.dart: 'UPSI-{id}'
function bookingRefLabel(id) {
  return `UPSI-${id}`;
}

// ---- Padanan categoryLabel() dari cart_manager.dart ----
function categoryLabel(category) {
  if (category === 'upsi') return 'UPSI Staff/Student';
  if (category === 'agensi') return 'Agensi';
  if (category === 'swasta') return 'Swasta';
  return category;
}

function historyStatusClass(status) {
  if (status === 'approved') return 'status-approved';
  if (status === 'rejected') return 'status-rejected';
  return 'status-pending';
}

function formatDateHistory(isoDate) {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  if (isNaN(d)) return isoDate;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatCreatedAtHistory(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d)) return '-';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}, ${hh}:${mm}`;
}

function escapeHtmlHistory(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---- Padanan _loadHistory() ----
async function loadHistory() {
  setHistoryLoading(true);
  try {
    const { data: userData } = await supabaseClient.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      historyBookings = [];
      renderHistoryGroups();
      return;
    }

    const { data, error } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    historyBookings = data ?? [];
    renderHistoryGroups();
  } catch (err) {
    alert('Ralat ambil rekod tempahan: ' + err.message);
    console.error(err);
  } finally {
    setHistoryLoading(false);
  }
}

function setHistoryLoading(isLoading) {
  document.getElementById('loading-state').style.display = isLoading ? 'flex' : 'none';
  document.getElementById('page-body').style.display = isLoading ? 'none' : 'block';
}

// ---- Padanan _groupBookings() ----
function groupHistoryBookings() {
  const groups = {};
  for (const b of historyBookings) {
    const key = b.order_group_id ?? `single_${b.id}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  }
  return Object.values(groups);
}

// ---- Padanan build() ListView + Card per group ----
function renderHistoryGroups() {
  const container = document.getElementById('history-groups');
  const groups = groupHistoryBookings();

  if (groups.length === 0) {
    container.innerHTML = `<div class="history-empty">Tiada rekod tempahan lagi.\nMula tempah bilik di Home!</div>`;
    return;
  }

  container.innerHTML = groups.map((groupItems) => {
    const first = groupItems[0];
    const isMultiple = groupItems.length > 1;
    const headerText = isMultiple
      ? `Tempahan (${groupItems.length} ruang) • Dibuat: ${formatCreatedAtHistory(first.created_at)}`
      : `Dibuat: ${formatCreatedAtHistory(first.created_at)}`;

    const rowsHtml = groupItems.map((b) => {
      const status = b.status ?? 'pending';
      return `
        <div class="history-item-row" data-booking-id="${b.id}">
          <div class="history-item-row__icon">
            <span class="material-symbols-outlined">event_available</span>
          </div>
          <div class="history-item-row__body">
            <p class="history-item-row__ref">${escapeHtmlHistory(bookingRefLabel(b.id))}</p>
            <p class="history-item-row__title">${escapeHtmlHistory(b.space_name ?? '')}</p>
            <p class="history-item-row__meta">${formatDateHistory(b.booking_date)} • ${escapeHtmlHistory(b.session ?? '')}</p>
            <p class="history-item-row__price">RM ${b.price ?? 0}</p>
          </div>
          <span class="history-item-row__status ${historyStatusClass(status)}">${status.toUpperCase()}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="history-group-card">
        <div class="history-group-card__header">
          <span class="material-symbols-outlined">receipt_long</span>
          <span>${escapeHtmlHistory(headerText)}</span>
        </div>
        ${rowsHtml}
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-booking-id]').forEach((row) => {
    row.addEventListener('click', () => {
      const booking = historyBookings.find((x) => String(x.id) === row.dataset.bookingId);
      showHistoryBookingDetail(booking);
    });
  });
}

// ---- Padanan _showBookingDetail() ----
async function showHistoryBookingDetail(booking) {
  let roomImages = [];
  try {
    const { data } = await supabaseClient
      .from('spaces')
      .select('image_urls')
      .eq('id', booking.space_id)
      .maybeSingle();
    roomImages = (data?.image_urls ?? []).map(String);
  } catch (_) {
    roomImages = [];
  }

  let receiptUrl = null;
  if (booking.receipt_url) {
    try {
      const { data, error } = await supabaseClient.storage
        .from('receipts')
        .createSignedUrl(booking.receipt_url, 3600);
      if (!error) receiptUrl = data.signedUrl;
    } catch (_) {
      receiptUrl = null;
    }
  }

  const status = booking.status ?? 'pending';
  const overlay = document.getElementById('history-detail-modal-overlay');

  const carouselHtml = roomImages.length > 0
    ? `<div class="history-image-carousel">${roomImages.map((url) => `
        <img src="${url}" alt="Gambar bilik" onerror="this.replaceWith(Object.assign(document.createElement('div'), {
          className: 'history-image-carousel__placeholder',
          innerHTML: '<span class=&quot;material-symbols-outlined&quot;>meeting_room</span>'
        }))" />
      `).join('')}</div>`
    : `<div class="history-image-carousel__placeholder" style="width:100%; margin-bottom:14px;"><span class="material-symbols-outlined">meeting_room</span></div>`;

  const receiptHtml = receiptUrl
    ? `<img class="history-receipt-img" src="${receiptUrl}" alt="Resit"
         onerror="this.replaceWith(Object.assign(document.createElement('p'), {
           className: 'history-receipt-fallback', textContent: 'Gagal papar resit (mungkin fail PDF).'
         }))" />`
    : `<p class="history-receipt-fallback">Tiada resit.</p>`;

  overlay.innerHTML = `
    <div class="modal-box history-detail-modal-box">
      <h3>${escapeHtmlHistory(booking.space_name ?? '')}</h3>
      ${carouselHtml}
      ${historyDetailRow('No. Rujukan', bookingRefLabel(booking.id))}
      ${historyDetailRow('Tarikh', booking.booking_date ?? '-')}
      ${historyDetailRow('Sesi', booking.session ?? '-')}
      ${historyDetailRow('Kategori', categoryLabel(booking.category))}
      ${historyDetailRow('Jumlah', `RM ${booking.price ?? ''}`)}
      ${historyDetailRow('Status', status.toUpperCase())}
      ${historyDetailRow('Dibuat', formatCreatedAtHistory(booking.created_at))}

      <p class="history-receipt-heading">Resit Pembayaran Anda:</p>
      ${receiptHtml}

      <button class="history-detail-close-btn" id="history-detail-close-btn">Tutup</button>
    </div>
  `;
  overlay.classList.add('open');

  document.getElementById('history-detail-close-btn').addEventListener('click', () => {
    overlay.classList.remove('open');
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
}

function historyDetailRow(label, value) {
  return `
    <div class="history-detail-row">
      <span class="history-detail-row__label">${escapeHtmlHistory(label)}</span>
      <span class="history-detail-row__value">${escapeHtmlHistory(value)}</span>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadHistory();

  // Padanan UserDrawer
  const historyRole = new URLSearchParams(window.location.search).get('role') ?? 'guest';
  renderUserDrawer('drawer-container', historyRole);
  document.getElementById('drawer-menu-btn').addEventListener('click', openUserDrawer);

  // Padanan AppBottomNav(role, currentIndex: 3)
  renderAppBottomNav('bottom-nav-container', new URLSearchParams(window.location.search).get('role') ?? 'guest', 3);
});