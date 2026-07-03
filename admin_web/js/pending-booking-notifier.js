/* ============================================
   Pending Booking Notifier
   Padanan terus dengan PendingBookingNotifier (Flutter singleton)

   Dipakai untuk papar badge nombor kat icon Reservation
   (bottom nav + drawer) - sama konsep macam badge cart.
   ============================================ */

const PendingBookingNotifier = (() => {
  let _channel = null;
  let _count = 0;
  const _listeners = new Set();

  function _setCount(newCount) {
    if (newCount === _count) return;
    _count = newCount;
    _listeners.forEach((cb) => cb(_count));
  }

  // ---- Padanan .stream(primaryKey: ['id']).listen(...) ----
  async function _refreshCount() {
    const { data, error } = await supabaseClient
      .from('bookings')
      .select('id')
      .eq('status', 'pending');

    if (!error) _setCount((data ?? []).length);
  }

  // ---- Padanan start() ----
  function start() {
    stop();
    _refreshCount(); // load awal — padanan emit pertama dari .stream()

    _channel = supabaseClient
      .channel('pending-bookings-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => _refreshCount()
      )
      .subscribe();
  }

  // ---- Padanan stop() ----
  function stop() {
    if (_channel) {
      supabaseClient.removeChannel(_channel);
      _channel = null;
    }
    _setCount(0);
  }

  function getCount() {
    return _count;
  }

  // ---- Padanan ValueListenableBuilder — daftar listener untuk perubahan count ----
  function onChange(callback) {
    _listeners.add(callback);
    return () => _listeners.delete(callback); // unsubscribe function
  }

  return { start, stop, getCount, onChange };
})();

// Auto-start bila page load — padanan PendingBookingNotifier.instance.start()
// dalam initState() AdminDashboard (dipanggil sekali, count dikongsi semua page)
document.addEventListener('DOMContentLoaded', () => {
  PendingBookingNotifier.start();
});