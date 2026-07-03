/* ============================================
   Reservation Management
   Padanan terus dengan _ReservationManagementPageState (Flutter)
   ============================================ */

let reservationBookings = [];
let reservationPendingDelete = null;
let editBookingState = null; // simpan state semasa modal edit terbuka

// ---- Padanan bookingRefLabel() dari cart_manager.dart ----
// Format confirmed dari BookingSuccessPage & report_generator.dart: 'UPSI-{id}'
function bookingRefLabel(id) {
  return `UPSI-${id}`;
}

function reservationStatusClass(status) {
  if (status === 'approved') return 'status-approved';
  if (status === 'rejected') return 'status-rejected';
  return 'status-pending';
}

function formatCreatedAt(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d)) return '-';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}, ${hh}:${mm}`;
}

// ---- Padanan _load() ----
async function loadReservations() {
  setReservationLoading(true);
  try {
    const { data, error } = await supabaseClient
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    reservationBookings = data ?? [];
    renderReservationGroups();
  } catch (err) {
    alert('Ralat: ' + err.message);
    console.error(err);
  } finally {
    setReservationLoading(false);
  }
}

function setReservationLoading(isLoading) {
  document.getElementById('loading-state').style.display = isLoading ? 'flex' : 'none';
  document.getElementById('page-body').style.display = isLoading ? 'none' : 'block';
}

// ---- Padanan _groupBookings() ----
function groupBookings() {
  const groups = {};
  for (const b of reservationBookings) {
    const key = b.order_group_id ?? `single_${b.id}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  }
  return Object.values(groups);
}

// ---- Padanan build() ListView.builder + _bookingRow() ----
function renderReservationGroups() {
  const container = document.getElementById('reservation-list');
  const groups = groupBookings();

  if (groups.length === 0) {
    container.innerHTML = `<div class="reservation-empty">Tiada tempahan lagi.</div>`;
    return;
  }

  container.innerHTML = groups.map((groupItems) => {
    const first = groupItems[0];
    const isMultiple = groupItems.length > 1;

    const headerHtml = isMultiple
      ? `<div class="booking-group-card__header">Tempahan (${groupItems.length} ruang) • Dibuat: ${formatCreatedAt(first.created_at)}</div>`
      : '';

    const rowsHtml = groupItems.map((b) => {
      const status = b.status ?? 'pending';
      const contact = b.contact_name || b.contact_email || '-';
      return `
        <div class="booking-row">
          <div class="booking-row__info">
            <p class="booking-row__ref">${escapeHtmlReservation(bookingRefLabel(b.id))}</p>
            <p class="booking-row__title">${escapeHtmlReservation(b.space_name ?? '')}</p>
            <p class="booking-row__contact">${escapeHtmlReservation(contact)}</p>
            <p class="booking-row__meta">${escapeHtmlReservation(b.booking_date ?? '')} • ${escapeHtmlReservation(b.session ?? '')}</p>
          </div>
          <div class="booking-row__trailing">
            <span class="booking-row__status ${reservationStatusClass(status)}">${status.toUpperCase()}</span>
            <div class="booking-row__actions">
              <button class="icon-btn" data-view-id="${b.id}" aria-label="Lihat"><span class="material-symbols-outlined">visibility</span></button>
              <button class="icon-btn" data-edit-id="${b.id}" aria-label="Edit"><span class="material-symbols-outlined">edit</span></button>
              <button class="icon-btn icon-btn--danger" data-delete-id="${b.id}" aria-label="Padam"><span class="material-symbols-outlined">delete</span></button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `<div class="booking-group-card">${headerHtml}${rowsHtml}</div>`;
  }).join('');

  container.querySelectorAll('[data-view-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const b = reservationBookings.find((x) => String(x.id) === btn.dataset.viewId);
      showBookingDetailDialog(b, loadReservations);
    });
  });
  container.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const b = reservationBookings.find((x) => String(x.id) === btn.dataset.editId);
      openEditBookingModal(b);
    });
  });
  container.querySelectorAll('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const b = reservationBookings.find((x) => String(x.id) === btn.dataset.deleteId);
      openDeleteBookingConfirm(b);
    });
  });
}

function escapeHtmlReservation(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---- Padanan _deleteBooking() confirm dialog ----
function openDeleteBookingConfirm(booking) {
  reservationPendingDelete = booking;
  const contact = booking.contact_email || booking.contact_name || '-';
  document.getElementById('booking-delete-text').textContent =
    `Padam tempahan "${booking.space_name}" oleh ${contact}?`;
  document.getElementById('booking-delete-modal-overlay').classList.add('open');
}

async function confirmDeleteBooking() {
  document.getElementById('booking-delete-modal-overlay').classList.remove('open');
  if (!reservationPendingDelete) return;

  try {
    const { error } = await supabaseClient
      .from('bookings')
      .delete()
      .eq('id', reservationPendingDelete.id);
    if (error) throw error;
    loadReservations();
  } catch (err) {
    alert('Ralat padam: ' + err.message);
  } finally {
    reservationPendingDelete = null;
  }
}

// ============================================
// Edit Booking Modal — padanan _editBooking()
// ============================================
async function openEditBookingModal(booking) {
  // ---- Ambil tarikh yang dah "blocked" (booked & approved) untuk space ni ----
  let bookedDates = [];
  try {
    const { data } = await supabaseClient
      .from('bookings')
      .select('id, booking_date')
      .eq('space_id', booking.space_id)
      .eq('status', 'approved');
    bookedDates = (data ?? [])
      .filter((b) => b.id !== booking.id)
      .map((b) => b.booking_date);
  } catch (_) {
    bookedDates = [];
  }

  editBookingState = { booking, bookedDates };

  const overlay = document.getElementById('edit-booking-modal-overlay');
  overlay.innerHTML = `
    <div class="modal-box edit-modal-box">
      <h3>Edit Tempahan</h3>

      <div class="edit-row" id="edit-date-row">
        <div>
          <p class="edit-row__label"><span class="material-symbols-outlined">calendar_today</span>Tarikh</p>
          <p class="edit-row__value" id="edit-date-display">${formatDisplayDate(booking.booking_date)}</p>
        </div>
        <span class="material-symbols-outlined">edit_calendar</span>
        <input type="date" id="edit-date-input" value="${booking.booking_date ?? ''}" />
      </div>

      <div class="edit-row" style="cursor:default;">
        <p class="edit-row__label"><span class="material-symbols-outlined">access_time</span>Sesi</p>
        <select id="edit-session-select">
          <option value="Half Day" ${booking.session === 'Half Day' ? 'selected' : ''}>Half Day</option>
          <option value="Full Day" ${booking.session === 'Full Day' ? 'selected' : ''}>Full Day</option>
        </select>
      </div>

      <div class="edit-field">
        <label for="edit-name-input">Nama</label>
        <input type="text" id="edit-name-input" value="${escapeHtmlReservation(booking.contact_name ?? '')}" />
      </div>
      <div class="edit-field">
        <label for="edit-phone-input">No. Telefon</label>
        <input type="text" id="edit-phone-input" value="${escapeHtmlReservation(booking.contact_phone ?? '')}" />
      </div>
      <div class="edit-field">
        <label for="edit-pax-input">Pax</label>
        <input type="number" id="edit-pax-input" value="${booking.pax ?? ''}" />
      </div>
      <div class="edit-field">
        <label for="edit-purpose-input">Tujuan</label>
        <input type="text" id="edit-purpose-input" value="${escapeHtmlReservation(booking.purpose ?? '')}" />
      </div>

      <div class="edit-modal-actions">
        <button class="edit-btn--cancel" id="edit-cancel-btn">Batal</button>
        <button class="edit-btn--save" id="edit-save-btn">Simpan</button>
      </div>
    </div>
  `;
  overlay.classList.add('open');

  document.getElementById('edit-date-row').addEventListener('click', () => {
    const input = document.getElementById('edit-date-input');
    input.showPicker?.() ?? input.click();
  });

  document.getElementById('edit-date-input').addEventListener('change', (e) => {
    const picked = e.target.value;
    if (editBookingState.bookedDates.includes(picked)) {
      alert('Tarikh ni dah ditempah untuk bilik yang sama. Sila pilih tarikh lain.');
      e.target.value = editBookingState.booking.booking_date ?? '';
      return;
    }
    document.getElementById('edit-date-display').textContent = formatDisplayDate(picked);
  });

  document.getElementById('edit-cancel-btn').addEventListener('click', closeEditBookingModal);
  document.getElementById('edit-save-btn').addEventListener('click', saveEditBooking);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeEditBookingModal();
  });
}

function formatDisplayDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function closeEditBookingModal() {
  document.getElementById('edit-booking-modal-overlay').classList.remove('open');
  editBookingState = null;
}

// ---- Padanan bahagian _editBooking() lepas showDialog (kira harga & save) ----
async function saveEditBooking() {
  const { booking } = editBookingState;

  const newDate = document.getElementById('edit-date-input').value;
  const newSession = document.getElementById('edit-session-select').value;
  const name = document.getElementById('edit-name-input').value.trim();
  const phone = document.getElementById('edit-phone-input').value.trim();
  const pax = parseInt(document.getElementById('edit-pax-input').value, 10);
  const purpose = document.getElementById('edit-purpose-input').value.trim();

  try {
    const { data: spaceData, error: spaceErr } = await supabaseClient
      .from('spaces')
      .select('*')
      .eq('id', booking.space_id)
      .single();
    if (spaceErr) throw spaceErr;

    const isHalf = newSession === 'Half Day';
    const category = booking.category ?? 'upsi';
    let newPrice;
    if (category === 'upsi') {
      newPrice = isHalf ? spaceData.rate_upsi_half : spaceData.rate_upsi_full;
    } else if (category === 'agensi') {
      newPrice = isHalf ? spaceData.rate_agensi_half : spaceData.rate_agensi_full;
    } else {
      newPrice = isHalf ? spaceData.rate_swasta_half : spaceData.rate_swasta_full;
    }

    const { error } = await supabaseClient
      .from('bookings')
      .update({
        contact_name: name,
        contact_phone: phone,
        pax: isNaN(pax) ? null : pax,
        purpose,
        booking_date: newDate,
        session: newSession,
        price: newPrice,
      })
      .eq('id', booking.id);
    if (error) throw error;

    closeEditBookingModal();
    loadReservations();
  } catch (err) {
    alert('Ralat simpan: ' + err.message);
  }
}

// ============================================
// Report (Generate PDF) Modal — padanan _showReportDialog()
// ============================================
function openReportModal() {
  const now = new Date();
  const overlay = document.getElementById('report-modal-overlay');

  const monthOptions = BULAN_MELAYU.slice(1).map((name, i) =>
    `<option value="${i + 1}" ${i + 1 === now.getMonth() + 1 ? 'selected' : ''}>${name}</option>`
  ).join('');

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const yearOptions = years.map((y) =>
    `<option value="${y}" ${y === now.getFullYear() ? 'selected' : ''}>${y}</option>`
  ).join('');

  overlay.innerHTML = `
    <div class="modal-box report-modal-box">
      <h3>Generate Laporan PDF</h3>
      <div class="edit-field">
        <label for="report-month-select">Bulan</label>
        <select id="report-month-select" style="width:100%;padding:10px;border-radius:6px;border:1px solid #d0d0d0;">${monthOptions}</select>
      </div>
      <div class="edit-field">
        <label for="report-year-select">Tahun</label>
        <select id="report-year-select" style="width:100%;padding:10px;border-radius:6px;border:1px solid #d0d0d0;">${yearOptions}</select>
      </div>
      <div class="edit-modal-actions">
        <button class="edit-btn--cancel" id="report-cancel-btn">Batal</button>
        <button class="edit-btn--save" id="report-generate-btn">Generate</button>
      </div>
    </div>
  `;
  overlay.classList.add('open');

  document.getElementById('report-cancel-btn').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
  document.getElementById('report-generate-btn').addEventListener('click', () => {
    const month = Number(document.getElementById('report-month-select').value);
    const year = Number(document.getElementById('report-year-select').value);
    overlay.classList.remove('open');
    generateMonthlyReport(month, year);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadReservations();

  document.getElementById('pdf-report-btn').addEventListener('click', openReportModal);

  document.getElementById('booking-delete-cancel-btn').addEventListener('click', () => {
    document.getElementById('booking-delete-modal-overlay').classList.remove('open');
    reservationPendingDelete = null;
  });
  document.getElementById('booking-delete-confirm-btn').addEventListener('click', confirmDeleteBooking);

  // Padanan AdminBottomNav(currentIndex: 2) + AdminDrawer
  syncAdminBottomNavBadge('bottom-nav-container', 2);
  syncAdminDrawerBadge('drawer-container');
  document.getElementById('drawer-menu-btn').addEventListener('click', openDrawer);

  // Padanan initState(): listenForNewBookings(context, _load)
  listenForNewBookings(loadReservations);
});

// Padanan dispose(): stopListeningForNewBookings()
window.addEventListener('beforeunload', () => {
  stopListeningForNewBookings();
});