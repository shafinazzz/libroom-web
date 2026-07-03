
let announcements = [];
let announcementPendingDelete = null;

// ---- Padanan _statusFor() ----
// NOTA: banding tarikh SAHAJA (bukan Date+time) untuk elak bug timezone —
// new Date('YYYY-MM-DD') dianggap UTC midnight, boleh jadi jam 8 pagi
// waktu Malaysia, buat pengumuman "expired" awal walaupun tarikh tu
// sepatutnya sah sepanjang hari.
function todayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function statusFor(a) {
  const today = todayDateString(); // 'YYYY-MM-DD' ikut local time
  const start = a.start_date ?? today;
  const end = a.end_date ?? null;

  if (today < start) return 'Scheduled';
  if (end && today > end) return 'Expired';
  return 'Active';
}

function statusClass(status) {
  if (status === 'Active') return 'status-active';
  if (status === 'Scheduled') return 'status-scheduled';
  return 'status-expired';
}

// ---- Padanan _load() ----
async function loadAnnouncements() {
  setLoading(true);
  try {
    const { data, error } = await supabaseClient
      .from('announcements')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    announcements = data ?? [];
    renderStats();
    renderAnnouncementList();
  } catch (err) {
    alert('Ralat: ' + err.message);
    console.error(err);
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  document.getElementById('loading-state').style.display = isLoading ? 'flex' : 'none';
  document.getElementById('page-body').style.display = isLoading ? 'none' : 'block';
}

// ---- Padanan stat cards (Total / Active / Scheduled / Expired) ----
function renderStats() {
  const total = announcements.length;
  const active = announcements.filter((a) => statusFor(a) === 'Active').length;
  const scheduled = announcements.filter((a) => statusFor(a) === 'Scheduled').length;
  const expired = announcements.filter((a) => statusFor(a) === 'Expired').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-active').textContent = active;
  document.getElementById('stat-scheduled').textContent = scheduled;
  document.getElementById('stat-expired').textContent = expired;
}

// ---- Padanan ..._announcements.map((a) => Card(...)) ----
function renderAnnouncementList() {
  const container = document.getElementById('announcement-list');

  if (announcements.length === 0) {
    container.innerHTML = `<div class="empty-state">Tiada pengumuman lagi. Tekan + untuk tambah.</div>`;
    return;
  }

  container.innerHTML = announcements.map((a) => {
    const status = statusFor(a);
    const dateRange = a.end_date
      ? `${escapeHtml(a.start_date)} - ${escapeHtml(a.end_date)}`
      : `${escapeHtml(a.start_date)} (Ongoing)`;

    return `
      <div class="announcement-card">
        <div class="announcement-card__avatar">
          <span class="material-symbols-outlined">campaign</span>
        </div>
        <div class="announcement-card__body">
          <p class="announcement-card__title">${escapeHtml(a.title ?? '')}</p>
          <p class="announcement-card__subtitle">${escapeHtml(a.content ?? '')}<br>${dateRange}</p>
        </div>
        <div class="announcement-card__trailing">
          <span class="announcement-card__status ${statusClass(status)}">${status}</span>
          <div class="announcement-card__actions">
            <button class="icon-btn" data-edit-id="${a.id}" aria-label="Edit">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="icon-btn icon-btn--danger" data-delete-id="${a.id}" aria-label="Padam">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = `announcement_form.html?id=${btn.dataset.editId}`;
    });
  });

  container.querySelectorAll('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const a = announcements.find((x) => String(x.id) === btn.dataset.deleteId);
      openDeleteConfirm(a);
    });
  });
}

// ---- Padanan _delete() confirm dialog ----
function openDeleteConfirm(announcement) {
  announcementPendingDelete = announcement;
  document.getElementById('delete-confirm-text').textContent =
    `Padam "${announcement.title}"? Pengumuman ni akan terus hilang dari semua user.`;
  document.getElementById('delete-modal-overlay').classList.add('open');
}

async function confirmDelete() {
  document.getElementById('delete-modal-overlay').classList.remove('open');
  if (!announcementPendingDelete) return;

  try {
    const { error } = await supabaseClient
      .from('announcements')
      .delete()
      .eq('id', announcementPendingDelete.id);
    if (error) throw error;
    loadAnnouncements();
  } catch (err) {
    alert('Ralat padam: ' + err.message);
  } finally {
    announcementPendingDelete = null;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  loadAnnouncements();

  document.getElementById('fab-add-btn').addEventListener('click', () => {
    window.location.href = 'announcement_form.html';
  });

  document.getElementById('delete-cancel-btn').addEventListener('click', () => {
    document.getElementById('delete-modal-overlay').classList.remove('open');
    announcementPendingDelete = null;
  });
  document.getElementById('delete-confirm-btn').addEventListener('click', confirmDelete);

  // Padanan AdminBottomNav(currentIndex: 4) + AdminDrawer
  syncAdminBottomNavBadge('bottom-nav-container', 4);
  syncAdminDrawerBadge('drawer-container');
  document.getElementById('drawer-menu-btn').addEventListener('click', openDrawer);
});