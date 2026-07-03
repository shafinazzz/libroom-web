/* ============================================
   Booking Notifier
   Padanan terus dengan booking_notifier.dart

   NOTA: pendekatan sedikit berbeza dari kod Flutter asal — di sini kita
   dengar terus event INSERT (postgres_changes) daripada Supabase Realtime,
   bukan diff senarai penuh setiap kali ada perubahan. Hasil akhir sama:
   admin dapat notify + auto-refresh bila ada booking baru masuk.

   PENTING: pastikan realtime dah enable untuk table 'bookings' dalam
   Supabase (`enable_realtime_bookings.sql` — sama macam versi Flutter).
   ============================================ */

let _bookingChannel = null;

/**
 * @param {function} onNewBooking - dipanggil bila ada row baru di-insert
 */
function listenForNewBookings(onNewBooking) {
  stopListeningForNewBookings();

  _bookingChannel = supabaseClient
    .channel('bookings-new-insert')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bookings' },
      (payload) => {
        const newBooking = payload.new ?? {};
        const who = newBooking.contact_name || newBooking.contact_email || 'pengguna';

        showToast(`🔔 Tempahan baru: ${newBooking.space_name ?? 'Bilik'} oleh ${who}`, 6000);
        onNewBooking();
      }
    )
    .subscribe();
}

function stopListeningForNewBookings() {
  if (_bookingChannel) {
    supabaseClient.removeChannel(_bookingChannel);
    _bookingChannel = null;
  }
}