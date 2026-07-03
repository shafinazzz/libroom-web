/* ============================================
   Toast Notification (generic)
   Padanan terus dengan ScaffoldMessenger.showSnackBar (Flutter)
   ============================================ */

function ensureToastContainer() {
  if (document.getElementById('toast-container')) return;
  const div = document.createElement('div');
  div.id = 'toast-container';
  div.className = 'toast-container';
  document.body.appendChild(div);
}

/**
 * @param {string} message
 * @param {number} durationMs - default 6000 (padanan Duration(seconds: 6))
 */
function showToast(message, durationMs = 6000) {
  ensureToastContainer();
  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 200);
  }, durationMs);
}