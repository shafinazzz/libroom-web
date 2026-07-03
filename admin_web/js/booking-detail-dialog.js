/* ============================================
   Booking Detail Dialog
   Padanan terus dengan booking_detail_dialog.dart
   Dikongsi oleh Reservation Management & Payment Management
   ============================================ */

// ---- Padanan shortBookingId() ----
function shortBookingId(id) {
  const str = String(id);
  return str.length >= 8 ? str.slice(0, 8).toUpperCase() : str.toUpperCase();
}

function bookingDetailRow(label, value) {
  return `
    <div class="booking-detail-row">
      <span class="booking-detail-row__label">${escapeHtmlBooking(label)}</span>
      <span class="booking-detail-row__value">${escapeHtmlBooking(value)}</span>
    </div>
  `;
}

function escapeHtmlBooking(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

/**
 * Pastikan container modal ('booking-detail-modal-container') wujud dalam DOM.
 * Dipanggil sekali secara automatik bila showBookingDetailDialog() digunakan.
 */
function ensureBookingDetailModalContainer() {
  if (document.getElementById('booking-detail-modal-overlay')) return;

  const div = document.createElement('div');
  div.id = 'booking-detail-modal-overlay';
  div.className = 'modal-overlay'; // guna class dikongsi dari admin-drawer.css
  document.body.appendChild(div);

  div.addEventListener('click', (e) => {
    if (e.target === div) closeBookingDetailDialog();
  });
}

function closeBookingDetailDialog() {
  const overlay = document.getElementById('booking-detail-modal-overlay');
  if (overlay) overlay.classList.remove('open');
}

/**
 * Padanan showBookingDetailDialog(context, booking, onChanged) (Flutter).
 * @param {object} booking - row dari table 'bookings'
 * @param {function} onChanged - dipanggil selepas Approve/Reject berjaya (untuk reload list)
 */
async function showBookingDetailDialog(booking, onChanged) {
  ensureBookingDetailModalContainer();

  const overlay = document.getElementById('booking-detail-modal-overlay');
  const status = booking.status ?? 'pending';

  // ---- Ambil signed URL untuk resit (padanan createSignedUrl) ----
  let signedUrl = null;
  const receiptPath = booking.receipt_url;
  if (receiptPath) {
    try {
      const { data, error } = await supabaseClient.storage
        .from('receipts')
        .createSignedUrl(receiptPath, 3600);
      if (!error) signedUrl = data.signedUrl;
    } catch (_) {
      signedUrl = null;
    }
  }

  const receiptHtml = signedUrl
    ? `<img class="booking-receipt-img" src="${signedUrl}" alt="Resit pembayaran"
         onerror="this.replaceWith(Object.assign(document.createElement('p'), {
           className: 'booking-receipt-fallback',
           textContent: 'Gagal papar resit (mungkin fail PDF - buka manual di Storage Supabase).'
         }))" />`
    : `<p class="booking-receipt-fallback">Tiada resit / gagal muat.</p>`;

  overlay.innerHTML = `
    <div class="modal-box booking-modal-box">
      <h3>${escapeHtmlBooking(booking.space_name ?? '')}</h3>

      ${bookingDetailRow('Booking ID', shortBookingId(booking.id))}
      ${bookingDetailRow('Nama', booking.contact_name ?? '-')}
      ${bookingDetailRow('Email', booking.contact_email ?? '-')}
      ${bookingDetailRow('Telefon', booking.contact_phone ?? '-')}
      ${bookingDetailRow('Tarikh', booking.booking_date ?? '-')}
      ${bookingDetailRow('Sesi', booking.session ?? '-')}
      ${bookingDetailRow('Kategori', booking.category ?? '-')}
      ${bookingDetailRow('Pax', booking.pax ?? '-')}
      ${bookingDetailRow('Tujuan', booking.purpose ?? '-')}
      ${bookingDetailRow('Jumlah', `RM ${booking.price ?? ''}`)}
      ${bookingDetailRow('Kaedah Bayar', 'QR / DuitNow')}
      ${bookingDetailRow('Status', status.toUpperCase())}

      <p class="booking-receipt-heading">Resit Pembayaran:</p>
      ${receiptHtml}

      <div class="booking-modal-actions">
        <button class="booking-btn--close" id="booking-close-btn">Tutup</button>
        ${status !== 'rejected' ? `<button class="booking-btn--reject" id="booking-reject-btn">Reject</button>` : ''}
        ${status !== 'approved' ? `<button class="booking-btn--approve" id="booking-approve-btn">Approve</button>` : ''}
      </div>
    </div>
  `;

  overlay.classList.add('open');

  document.getElementById('booking-close-btn').addEventListener('click', closeBookingDetailDialog);

  const rejectBtn = document.getElementById('booking-reject-btn');
  if (rejectBtn) {
    rejectBtn.addEventListener('click', async () => {
      await updateBookingStatus(booking.id, 'rejected');
      closeBookingDetailDialog();
      onChanged();
    });
  }

  const approveBtn = document.getElementById('booking-approve-btn');
  if (approveBtn) {
    approveBtn.addEventListener('click', async () => {
      await updateBookingStatus(booking.id, 'approved');
      closeBookingDetailDialog();
      onChanged();
    });
  }
}

async function updateBookingStatus(bookingId, status) {
  const { error } = await supabaseClient
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);
  if (error) {
    alert('Ralat kemas kini status: ' + error.message);
  }
}