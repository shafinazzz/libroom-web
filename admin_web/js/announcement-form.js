/* ============================================
   Announcement Form
   Padanan terus dengan _AnnouncementFormPageState (Flutter)
   ============================================ */

let existingAnnouncement = null; // null = mode tambah, ada value = mode edit

function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// ---- Padanan _fmt() ----
function fmtDate(isoStr) {
  if (!isoStr) return 'Tiada (Ongoing)';
  const d = new Date(isoStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function todayDateStringForm() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ---- Padanan initState() -> load existing kalau mode edit ----
async function initForm() {
  const id = getIdFromUrl();
  const today = todayDateStringForm();

  // Sekat kalendar — tak boleh pilih tarikh lampau (untuk pengumuman baru).
  // Kalau mode edit & tarikh sedia ada dah lepas, kekalkan (elak "hilang" data lama).
  document.getElementById('start-date-input').min = today;
  document.getElementById('end-date-input').min = today;

  if (id) {
    document.getElementById('form-title-heading').textContent = 'Edit Pengumuman';
    document.getElementById('submit-btn-label').textContent = 'Simpan Perubahan';
    document.title = 'Edit Pengumuman';

    try {
      const { data, error } = await supabaseClient
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;

      existingAnnouncement = data;
      document.getElementById('title-input').value = data.title ?? '';
      document.getElementById('content-input').value = data.content ?? '';
      document.getElementById('category-select').value = data.category ?? 'notice';
      document.getElementById('start-date-input').value = data.start_date ?? '';
      document.getElementById('end-date-input').value = data.end_date ?? '';

      // Mode edit: kalau tarikh sedia ada dah lampau, kekalkan (bukan sekat ke 'today')
      if (data.start_date) {
        document.getElementById('start-date-input').min = data.start_date < today ? data.start_date : today;
        document.getElementById('end-date-input').min = data.start_date;
      }

      refreshDateDisplay();
    } catch (err) {
      alert('Ralat ambil data: ' + err.message);
    }
  } else {
    // Default tarikh mula = hari ini — padanan _startDate = DateTime.now()
    document.getElementById('start-date-input').value = new Date().toISOString().split('T')[0];
    refreshDateDisplay();
  }
}

function refreshDateDisplay() {
  const start = document.getElementById('start-date-input').value;
  const end = document.getElementById('end-date-input').value;

  document.getElementById('start-date-display').textContent = fmtDate(start);
  document.getElementById('end-date-display').textContent = fmtDate(end);
  document.getElementById('end-date-clear-btn').style.display = end ? 'flex' : 'none';
}

// ---- Padanan _save() ----
async function saveAnnouncement() {
  const title = document.getElementById('title-input').value.trim();
  const content = document.getElementById('content-input').value.trim();

  if (!title || !content) {
    alert('Tajuk dan kandungan wajib diisi.');
    return;
  }

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  document.getElementById('submit-btn-label').style.display = 'none';
  document.getElementById('submit-spinner').style.display = 'inline-block';

  try {
    const payload = {
      title,
      content,
      category: document.getElementById('category-select').value,
      start_date: document.getElementById('start-date-input').value,
      end_date: document.getElementById('end-date-input').value || null,
    };

    let error;
    if (existingAnnouncement) {
      ({ error } = await supabaseClient
        .from('announcements')
        .update(payload)
        .eq('id', existingAnnouncement.id));
    } else {
      ({ error } = await supabaseClient.from('announcements').insert(payload));
    }
    if (error) throw error;

    // Padanan Navigator.pop(context, true) -> _load() di page sebelumnya
    window.location.href = 'announcement_management.html';
  } catch (err) {
    alert('Ralat simpan: ' + err.message);
    submitBtn.disabled = false;
    document.getElementById('submit-btn-label').style.display = 'inline';
    document.getElementById('submit-spinner').style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initForm();

  document.getElementById('start-date-row').addEventListener('click', () => {
    document.getElementById('start-date-input').showPicker?.() ?? document.getElementById('start-date-input').click();
  });
  document.getElementById('end-date-row').addEventListener('click', (e) => {
    if (e.target.closest('#end-date-clear-btn')) return; // elak trigger date picker bila klik clear
    document.getElementById('end-date-input').showPicker?.() ?? document.getElementById('end-date-input').click();
  });

  document.getElementById('start-date-input').addEventListener('change', () => {
    refreshDateDisplay();
    // Tarikh Tamat tak boleh sebelum Tarikh Mula
    const startVal = document.getElementById('start-date-input').value;
    if (startVal) document.getElementById('end-date-input').min = startVal;
  });
  document.getElementById('end-date-input').addEventListener('change', refreshDateDisplay);

  document.getElementById('end-date-clear-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('end-date-input').value = '';
    refreshDateDisplay();
  });

  document.getElementById('submit-btn').addEventListener('click', saveAnnouncement);
});