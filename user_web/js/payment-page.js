/* ============================================
   Payment Page
   Padanan terus dengan _PaymentPageState (Flutter)
   ============================================ */

let pickedReceiptFile = null;

function getPaymentRole() {
  const params = new URLSearchParams(window.location.search);
  return params.get('role') ?? 'guest';
}

const isGuestRole = getPaymentRole() === 'guest';

function escapeHtmlPayment(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatDatePayment(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// ---- Padanan build() bahagian Ringkasan Bil Tempahan ----
function renderPaymentSummary() {
  const items = CartManager.getItems();
  const total = CartManager.getTotal();

  document.getElementById('payment-items').innerHTML = items.map((item) => `
    <div class="payment-item">
      <p class="payment-item__title">Item Tempahan: ${escapeHtmlPayment(item.spaceName)}</p>
      <p class="payment-item__meta">Tarikh Sesi: ${formatDatePayment(item.date)}</p>
      <p class="payment-item__meta">Kategori: ${escapeHtmlPayment(categoryLabel(item.category))}</p>
      <p class="payment-item__meta">Sesi Tempahan: ${escapeHtmlPayment(item.session)}</p>
      <p class="payment-item__price">RM ${Number(item.price ?? 0).toFixed(2)}</p>
    </div>
  `).join('');

  document.getElementById('payment-total-value').textContent = `RM ${total.toFixed(2)}`;
}

// ---- Padanan categoryLabel() dari cart_manager.dart ----
function categoryLabel(category) {
  if (category === 'upsi') return 'UPSI Staff/Student';
  if (category === 'agensi') return 'Agensi';
  if (category === 'swasta') return 'Swasta';
  return category;
}

// ---- Padanan bookingRefLabel() — format confirmed: 'UPSI-{id}' ----
function bookingRefLabel(id) {
  return `UPSI-${id}`;
}

// ---- Padanan _pickReceipt() ----
function wireReceiptPicker() {
  document.getElementById('receipt-pick-btn').addEventListener('click', () => {
    document.getElementById('receipt-file-input').click();
  });

  document.getElementById('receipt-file-input').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      pickedReceiptFile = file;
      document.getElementById('receipt-filename').textContent = file.name;
    }
  });
}

// ---- Padanan _confirmAndPay() ----
async function confirmAndPay() {
  if (!pickedReceiptFile) {
    alert('Sila muat naik bukti pembayaran/resit dahulu.');
    return;
  }

  const name = document.getElementById('guest-name-input')?.value.trim();
  const phone = document.getElementById('guest-phone-input')?.value.trim();
  const email = document.getElementById('guest-email-input')?.value.trim();
  const pax = document.getElementById('guest-pax-input')?.value.trim();
  const purpose = document.getElementById('guest-purpose-input')?.value.trim();

  if (isGuestRole) {
    if (!name || !phone || !email || !pax) {
      alert('Sila lengkapkan maklumat hubungan dahulu.');
      return;
    }
  }

  const submitBtn = document.getElementById('confirm-pay-btn');
  submitBtn.disabled = true;
  document.getElementById('confirm-pay-label').style.display = 'none';
  document.getElementById('confirm-pay-spinner').style.display = 'inline-block';

  try {
    const { data: userData, error: userErr } = await supabaseClient.auth.getUser();
    if (userErr || !userData?.user) throw new Error('Sesi tamat, sila log masuk semula.');
    const user = userData.user;

    // ---- 1. Upload resit ke Storage bucket 'receipts' ----
    const ext = pickedReceiptFile.name.includes('.') ? pickedReceiptFile.name.split('.').pop() : 'png';
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadErr } = await supabaseClient.storage
      .from('receipts')
      .upload(filePath, pickedReceiptFile);
    if (uploadErr) throw uploadErr;

    // ---- 2. Insert setiap item cart jadi row 'bookings' ----
    const items = CartManager.getItems();
    const insertedIds = [];
    const orderGroupId = String(Date.now());

    for (const item of items) {
      const { data: inserted, error: insertErr } = await supabaseClient
        .from('bookings')
        .insert({
          user_id: user.id,
          space_id: item.spaceId,
          space_name: item.spaceName,
          booking_date: item.date,
          session: item.session,
          category: item.category,
          price: item.price,
          status: 'pending',
          contact_name: isGuestRole ? name : (user.user_metadata?.full_name ?? null),
          contact_phone: isGuestRole ? phone : null,
          contact_email: isGuestRole ? email : user.email,
          pax: isGuestRole ? (parseInt(pax, 10) || null) : null,
          purpose: isGuestRole ? purpose : null,
          receipt_url: filePath,
          created_at: new Date().toISOString(),
          order_group_id: orderGroupId,
        })
        .select('id');

      if (insertErr) throw insertErr;
      if (inserted && inserted.length > 0) insertedIds.push(inserted[0].id);
    }

    // ---- 3. Bersihkan cart ----
    const itemCount = items.length;
    CartManager.clear();

    // ---- 4. No. Rujukan guna id sebenar ----
    const referenceNumber = insertedIds.length > 0 ? bookingRefLabel(insertedIds[0]) : 'UPSI-?';

    // ---- 5. Ke page "Tempahan Dihantar!" ----
    window.location.replace(
      `booking_success.html?role=${getPaymentRole()}&itemCount=${itemCount}&ref=${encodeURIComponent(referenceNumber)}`
    );
  } catch (err) {
    alert('Ralat: ' + err.message);
    submitBtn.disabled = false;
    document.getElementById('confirm-pay-label').style.display = 'inline';
    document.getElementById('confirm-pay-spinner').style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (isGuestRole) {
    document.getElementById('guest-info-section').style.display = 'block';
  }

  renderPaymentSummary();
  wireReceiptPicker();

  document.getElementById('confirm-pay-btn').addEventListener('click', confirmAndPay);

  // Padanan UserDrawer(role: widget.role)
  renderUserDrawer('drawer-container', getPaymentRole());
  document.getElementById('drawer-menu-btn').addEventListener('click', openUserDrawer);
});