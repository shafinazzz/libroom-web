/* ============================================
   Announcement Popup
   Padanan terus dengan checkAndShowAnnouncements() (Flutter)
   ============================================ */

const ANNOUNCEMENT_SHOWN_KEY = 'libroom_shown_announcement_ids';

const BULAN_MELAYU_SHORT = [
  '', 'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis',
];

function formatTarikhAnnouncement(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d)) return '';
  return `${d.getDate()} ${BULAN_MELAYU_SHORT[d.getMonth() + 1]} ${d.getFullYear()}`;
}

// ---- Format julat tarikh penuh: "5 Jul 2026 - 10 Jul 2026" atau "5 Jul 2026 (Ongoing)" ----
function formatTarikhRangeAnnouncement(startIso, endIso) {
  const startFmt = formatTarikhAnnouncement(startIso);
  if (!endIso) return `${startFmt} (Ongoing)`;
  const endFmt = formatTarikhAnnouncement(endIso);
  return `${startFmt} - ${endFmt}`;
}

// ---- Padanan _shownAnnouncementIds (Set dalam memory) ----
// Guna sessionStorage supaya betul-betul "sekali per session" merentasi
// reload page (tak macam Flutter yang kekal dalam satu app memory).
function getShownAnnouncementIds() {
  try {
    const raw = sessionStorage.getItem(ANNOUNCEMENT_SHOWN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (_) {
    return new Set();
  }
}

function markAnnouncementShown(id) {
  const shown = getShownAnnouncementIds();
  shown.add(id);
  sessionStorage.setItem(ANNOUNCEMENT_SHOWN_KEY, JSON.stringify([...shown]));
}

function escapeHtmlAnnouncementPopup(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function todayDateStringPopup() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ---- Padanan checkAndShowAnnouncements(context) ----
async function checkAndShowAnnouncements() {
  try {
    const { data, error } = await supabaseClient
      .from('announcements')
      .select('*')
      .order('start_date', { ascending: false });
    if (error) throw error;

    const announcements = data ?? [];
    const today = todayDateStringPopup(); // banding tarikh je, elak bug timezone
    const shownIds = getShownAnnouncementIds();

    for (const a of announcements) {
      const id = String(a.id);
      if (shownIds.has(id)) continue;

      const start = a.start_date ?? today;
      const end = a.end_date ?? null;

      const isActive = today >= start && (!end || today <= end);
      if (!isActive) continue;

      markAnnouncementShown(id);
      await showAnnouncementPopup(a);
      break; // padanan await showDialog() — satu popup pada satu masa, urutan sama macam for-loop asal
    }
  } catch (_) {
    // Senyap je kalau gagal - jangan ganggu user dengan error pengumuman
  }
}

function showAnnouncementPopup(announcement) {
  return new Promise((resolve) => {
    ensureAnnouncementPopupContainer();
    const overlay = document.getElementById('announcement-popup-overlay');

    overlay.innerHTML = `
      <div class="announcement-popup-box">
        <div class="announcement-popup__header">
          <div class="announcement-popup__header-icon">
            <span class="material-symbols-outlined">campaign</span>
          </div>
          <p class="announcement-popup__header-label">PENGUMUMAN</p>
        </div>
        <div class="announcement-popup__body">
          <p class="announcement-popup__title">${escapeHtmlAnnouncementPopup(announcement.title ?? '')}</p>
          <p class="announcement-popup__content">${escapeHtmlAnnouncementPopup(announcement.content ?? '')}</p>
          <p class="announcement-popup__date">${formatTarikhRangeAnnouncement(announcement.start_date, announcement.end_date)}</p>
          <button class="announcement-popup__ok-btn" id="announcement-popup-ok-btn">Faham</button>
        </div>
      </div>
    `;
    overlay.classList.add('open');

    document.getElementById('announcement-popup-ok-btn').addEventListener('click', () => {
      overlay.classList.remove('open');
      resolve();
    });
  });
}

function ensureAnnouncementPopupContainer() {
  if (document.getElementById('announcement-popup-overlay')) return;
  const div = document.createElement('div');
  div.id = 'announcement-popup-overlay';
  div.className = 'announcement-popup-overlay';
  document.body.appendChild(div);
}