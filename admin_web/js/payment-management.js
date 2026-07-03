/* ============================================
   Payment Management
   Padanan terus dengan _PaymentManagementPageState (Flutter)
   ============================================ */

let paymentBookings = [];

function paymentStatusClass(status) {
  if (status === 'approved') return 'status-approved';
  if (status === 'rejected') return 'status-rejected';
  return 'status-pending';
}

// ---- Padanan _load() ----
async function loadPayments() {
  setPaymentLoading(true);
  try {
    const { data, error } = await supabaseClient
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    paymentBookings = data ?? [];
    renderPaymentStats();
    renderPaymentList();
  } catch (err) {
    alert('Ralat: ' + err.message);
    console.error(err);
  } finally {
    setPaymentLoading(false);
  }
}

function setPaymentLoading(isLoading) {
  document.getElementById('loading-state').style.display = isLoading ? 'flex' : 'none';
  document.getElementById('page-body').style.display = isLoading ? 'none' : 'block';
}

// ---- Padanan stat cards (Total / Paid / Pending / Rejected) ----
function renderPaymentStats() {
  const total = paymentBookings.length;
  const paid = paymentBookings.filter((b) => b.status === 'approved').length;
  const pending = paymentBookings.filter((b) => b.status === 'pending').length;
  const rejected = paymentBookings.filter((b) => b.status === 'rejected').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-paid').textContent = paid;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-rejected').textContent = rejected;
}

// ---- Padanan ..._bookings.map((b) => Card(...)) ----
function renderPaymentList() {
  const container = document.getElementById('payment-list');

  if (paymentBookings.length === 0) {
    container.innerHTML = `<div class="empty-state">Tiada rekod pembayaran.</div>`;
    return;
  }

  container.innerHTML = paymentBookings.map((b) => {
    const status = b.status ?? 'pending';
    return `
      <div class="payment-card">
        <div class="payment-card__avatar">
          <span class="material-symbols-outlined">qr_code_2</span>
        </div>
        <div class="payment-card__body">
          <p class="payment-card__title">${escapeHtmlPayment(b.space_name ?? '')}</p>
          <p class="payment-card__subtitle">Booking ID: ${shortBookingId(b.id)}<br>RM ${escapeHtmlPayment(b.price)} • QR/DuitNow</p>
        </div>
        <div class="payment-card__trailing">
          <span class="booking-card__status ${paymentStatusClass(status)}">${status.toUpperCase()}</span>
          <button class="payment-card__view-btn" data-view-id="${b.id}" aria-label="Lihat butiran">
            <span class="material-symbols-outlined">visibility</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-view-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const booking = paymentBookings.find((x) => String(x.id) === btn.dataset.viewId);
      showBookingDetailDialog(booking, loadPayments);
    });
  });
}

function escapeHtmlPayment(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  loadPayments();

  // Padanan AdminBottomNav(currentIndex: 3) + AdminDrawer
  syncAdminBottomNavBadge('bottom-nav-container', 3);
  syncAdminDrawerBadge('drawer-container');
  document.getElementById('drawer-menu-btn').addEventListener('click', openDrawer);
});