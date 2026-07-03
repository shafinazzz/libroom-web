/* ============================================
   Booking Page (Cart)
   Padanan terus dengan _BookingPageState (Flutter)
   ============================================ */

function getUserRole() {
  const params = new URLSearchParams(window.location.search);
  return params.get('role') ?? 'guest';
}

function formatDateDisplay(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function escapeHtmlBookingPage(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---- Padanan build() ValueListenableBuilder<List<CartItem>> ----
function renderCart() {
  const items = CartManager.getItems();
  const listEl = document.getElementById('cart-list');
  const footerEl = document.getElementById('cart-footer');

  if (items.length === 0) {
    listEl.innerHTML = `<div class="cart-empty">Cart anda kosong.</div>`;
    footerEl.style.display = 'none';
    return;
  }

  footerEl.style.display = 'block';

  listEl.innerHTML = items.map((item) => `
    <div class="cart-item-card">
      <div class="cart-item-card__avatar">
        <span class="material-symbols-outlined">meeting_room</span>
      </div>
      <div class="cart-item-card__body">
        <p class="cart-item-card__title">${escapeHtmlBookingPage(item.spaceName)}</p>
        <p class="cart-item-card__meta">Tarikh: ${formatDateDisplay(item.date)}</p>
        <p class="cart-item-card__meta">Sesi: ${escapeHtmlBookingPage(item.session)}</p>
      </div>
      <div class="cart-item-card__trailing">
        <span class="cart-item-card__price">RM ${Number(item.price ?? 0).toFixed(2)}</span>
        <div class="cart-item-card__actions">
          <button class="icon-btn icon-btn--edit" data-edit-id="${item.id}" aria-label="Edit">
            <span class="material-symbols-outlined">edit</span>
          </button>
          <button class="icon-btn icon-btn--danger" data-remove-id="${item.id}" aria-label="Padam">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = items.find((it) => it.id === btn.dataset.editId);
      openEditItemModal(item);
    });
  });
  listEl.querySelectorAll('[data-remove-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      CartManager.removeById(btn.dataset.removeId);
    });
  });

  renderCartFooter(items);
}

function renderCartFooter(items) {
  document.getElementById('cart-count-label').textContent =
    `Jumlah Keseluruhan (${items.length} Ruang):`;
  document.getElementById('cart-total-value').textContent =
    `RM ${CartManager.getTotal().toFixed(2)}`;
}

// ============================================
// Edit Item Modal — padanan _editItem()
// ============================================
async function openEditItemModal(item) {
  // ---- 1. Fetch tarikh yang dah approved untuk bilik ni ----
  let bookedDates = [];
  try {
    const { data, error } = await supabaseClient
      .from('bookings')
      .select('booking_date')
      .eq('space_id', item.spaceId)
      .eq('status', 'approved');
    if (error) throw error;
    bookedDates = (data ?? []).map((b) => b.booking_date);
  } catch (err) {
    showToastBookingPage('Ralat semak availability: ' + err.message);
    return;
  }

  const overlay = document.getElementById('edit-item-modal-overlay');
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>Edit ${escapeHtmlBookingPage(item.spaceName)}</h3>

      <div class="modal-row" id="edit-item-date-row">
        <div>
          <p class="modal-row__label"><span class="material-symbols-outlined">calendar_today</span>Tarikh</p>
          <p class="modal-row__value" id="edit-item-date-display">${formatDateDisplay(item.date)}</p>
        </div>
        <span class="material-symbols-outlined">edit_calendar</span>
        <input type="date" id="edit-item-date-input" value="${item.date ?? ''}" min="${new Date().toISOString().split('T')[0]}" />
      </div>

      <div class="modal-row" style="cursor:default;">
        <p class="modal-row__label"><span class="material-symbols-outlined">access_time</span>Sesi</p>
        <select id="edit-item-session-select">
          <option value="Half Day" ${item.session === 'Half Day' ? 'selected' : ''}>Half Day</option>
          <option value="Full Day" ${item.session === 'Full Day' ? 'selected' : ''}>Full Day</option>
        </select>
      </div>

      ${bookedDates.length > 0 ? `<p class="modal-hint">Nota: tarikh yang dah ditempah (approved) tak boleh dipilih dalam kalendar.</p>` : ''}

      <div class="modal-actions">
        <button id="edit-item-cancel-btn">Batal</button>
        <button class="primary" id="edit-item-save-btn">Simpan</button>
      </div>
    </div>
  `;
  overlay.classList.add('open');

  let selectedDate = item.date;

  document.getElementById('edit-item-date-row').addEventListener('click', () => {
    const input = document.getElementById('edit-item-date-input');
    input.showPicker?.() ?? input.click();
  });

  document.getElementById('edit-item-date-input').addEventListener('change', (e) => {
    const picked = e.target.value;
    if (bookedDates.includes(picked)) {
      alert('Tarikh ni dah ditempah (approved). Sila pilih tarikh lain.');
      e.target.value = selectedDate ?? '';
      return;
    }
    selectedDate = picked;
    document.getElementById('edit-item-date-display').textContent = formatDateDisplay(picked);
  });

  document.getElementById('edit-item-cancel-btn').addEventListener('click', () => {
    overlay.classList.remove('open');
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });

  document.getElementById('edit-item-save-btn').addEventListener('click', async () => {
    const newSession = document.getElementById('edit-item-session-select').value;
    overlay.classList.remove('open');
    await saveEditedItem(item, selectedDate, newSession);
  });
}

// ---- Padanan bahagian recompute harga lepas showDialog ----
async function saveEditedItem(item, newDate, newSession) {
  try {
    const { data: spaceData, error } = await supabaseClient
      .from('spaces')
      .select('*')
      .eq('id', item.spaceId)
      .single();
    if (error) throw error;

    const isHalf = newSession === 'Half Day';
    let rateValue;
    if (item.category === 'upsi') {
      rateValue = isHalf ? spaceData.rate_upsi_half : spaceData.rate_upsi_full;
    } else if (item.category === 'agensi') {
      rateValue = isHalf ? spaceData.rate_agensi_half : spaceData.rate_agensi_full;
    } else {
      rateValue = isHalf ? spaceData.rate_swasta_half : spaceData.rate_swasta_full;
    }

    CartManager.updateItem(item.id, {
      date: newDate,
      session: newSession,
      price: Number(rateValue ?? 0),
    });
  } catch (err) {
    showToastBookingPage('Ralat kemaskan harga: ' + err.message);
  }
}

// Fallback toast ringkas — guna alert() kalau toast.js tak dimuatkan
function showToastBookingPage(message) {
  if (typeof showToast === 'function') {
    showToast(message);
  } else {
    alert(message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  CartManager.onChange(renderCart);
  renderAppBottomNav('bottom-nav-container', getUserRole(), 2);

  document.getElementById('continue-payment-btn').addEventListener('click', () => {
    window.location.href = `payment_page.html?role=${getUserRole()}`;
  });

  // Padanan UserDrawer(role: widget.role)
  renderUserDrawer('drawer-container', getUserRole());
  document.getElementById('drawer-menu-btn').addEventListener('click', openUserDrawer);
});