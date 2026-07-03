/* ============================================
   Booking Success Page
   Padanan terus dengan BookingSuccessPage (Flutter)
   ============================================ */

function getBookingSuccessParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    role: params.get('role') ?? 'guest',
    itemCount: Number(params.get('itemCount') ?? 0),
    referenceNumber: params.get('ref') ?? '-',
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const { role, itemCount, referenceNumber } = getBookingSuccessParams();

  document.getElementById('success-desc').textContent =
    `${itemCount} ruang telah dihantar untuk kelulusan pustakawan. Anda akan dimaklumkan setelah disahkan.`;
  document.getElementById('success-ref-value').textContent = referenceNumber;

  // ---- Padanan Navigator.pushAndRemoveUntil(...) — window.location.replace()
  //      supaya butang "back" browser tak boleh balik ke page success ni ----
  document.getElementById('view-bookings-btn').addEventListener('click', () => {
    window.location.replace(`history.html?role=${role}`);
  });

  document.getElementById('home-btn').addEventListener('click', () => {
    window.location.replace(`user_dashboard.html?role=${role}`);
  });
});