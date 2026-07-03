/* ============================================
   Space Management (List)
   Padanan terus dengan _SpaceManagementPageState (Flutter)
   ============================================ */

let spaces = [];
let spacePendingDelete = null;

// ---- Padanan _loadSpaces() ----
async function loadSpaces() {
  setSpaceLoading(true);
  try {
    const { data, error } = await supabaseClient
      .from('spaces')
      .select('*')
      .order('name');

    if (error) throw error;
    spaces = data ?? [];
    renderSpaceList();
  } catch (err) {
    alert('Ralat ambil senarai bilik: ' + err.message);
    console.error(err);
  } finally {
    setSpaceLoading(false);
  }
}

function setSpaceLoading(isLoading) {
  document.getElementById('loading-state').style.display = isLoading ? 'flex' : 'none';
  document.getElementById('page-body').style.display = isLoading ? 'none' : 'block';
}

// ---- Padanan _buildThumbnail() + ListTile ----
function renderSpaceList() {
  const container = document.getElementById('space-list');

  if (spaces.length === 0) {
    container.innerHTML = `<div class="empty-state">Tiada bilik lagi. Tekan + untuk tambah.</div>`;
    return;
  }

  container.innerHTML = spaces.map((space) => {
    const isActive = space.is_active ?? true;
    const imageCount = (space.image_urls ?? []).length;
    const firstImage = (space.image_urls ?? [])[0];

    const thumbHtml = firstImage
      ? `<img class="space-card__thumb" src="${firstImage}" alt="${escapeHtmlSpace(space.name)}"
           onerror="this.replaceWith(Object.assign(document.createElement('div'), {
             className: 'space-card__thumb-placeholder',
             innerHTML: '<span class=&quot;material-symbols-outlined&quot;>meeting_room</span>'
           }))" />`
      : `<div class="space-card__thumb-placeholder"><span class="material-symbols-outlined">meeting_room</span></div>`;

    return `
      <div class="space-card">
        ${thumbHtml}
        <div class="space-card__body">
          <p class="space-card__title">${escapeHtmlSpace(space.name ?? '')}</p>
          <p class="space-card__rates">UPSI: RM${space.rate_upsi_half}/${space.rate_upsi_full}  •  Agensi: RM${space.rate_agensi_half}/${space.rate_agensi_full}  •  Swasta: RM${space.rate_swasta_half}/${space.rate_swasta_full}</p>
          <p class="space-card__meta ${isActive ? 'active' : 'inactive'}">${isActive ? 'Aktif' : 'Tidak Aktif'} • ${imageCount} gambar</p>
        </div>
        <button class="space-card__menu-btn" data-menu-id="${space.id}" aria-label="Menu">
          <span class="material-symbols-outlined">more_vert</span>
        </button>
        <div class="space-popup-menu" id="menu-${space.id}">
          <button data-action="edit" data-id="${space.id}">Edit</button>
          <button data-action="toggle" data-id="${space.id}">${isActive ? 'Nyahaktifkan' : 'Aktifkan'}</button>
          <button data-action="delete" data-id="${space.id}" class="danger">Padam</button>
        </div>
      </div>
    `;
  }).join('');

  wireSpaceCardEvents();
}

function wireSpaceCardEvents() {
  // ---- Toggle buka/tutup popup menu ----
  document.querySelectorAll('.space-card__menu-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById(`menu-${btn.dataset.menuId}`);
      closeAllSpacePopupMenus();
      menu.classList.add('open');
    });
  });

  document.querySelectorAll('.space-popup-menu button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllSpacePopupMenus();
      const space = spaces.find((s) => String(s.id) === btn.dataset.id);
      const action = btn.dataset.action;

      if (action === 'edit') window.location.href = `space_form.html?id=${space.id}`;
      if (action === 'toggle') toggleSpaceActive(space);
      if (action === 'delete') openDeleteSpaceConfirm(space);
    });
  });
}

function closeAllSpacePopupMenus() {
  document.querySelectorAll('.space-popup-menu.open').forEach((m) => m.classList.remove('open'));
}

document.addEventListener('click', closeAllSpacePopupMenus);

function escapeHtmlSpace(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---- Padanan _toggleActive() ----
async function toggleSpaceActive(space) {
  try {
    const { error } = await supabaseClient
      .from('spaces')
      .update({ is_active: !(space.is_active ?? true) })
      .eq('id', space.id);
    if (error) throw error;
    loadSpaces();
  } catch (err) {
    alert('Ralat: ' + err.message);
  }
}

// ---- Padanan _deleteSpace() confirm dialog ----
function openDeleteSpaceConfirm(space) {
  spacePendingDelete = space;
  document.getElementById('space-delete-text').textContent =
    `Padam "${space.name}"? Tindakan ni tak boleh undo, dan bilik ni akan terus hilang dari paparan user juga.`;
  document.getElementById('space-delete-modal-overlay').classList.add('open');
}

async function confirmDeleteSpace() {
  document.getElementById('space-delete-modal-overlay').classList.remove('open');
  if (!spacePendingDelete) return;

  try {
    const { error } = await supabaseClient
      .from('spaces')
      .delete()
      .eq('id', spacePendingDelete.id);
    if (error) throw error;
    loadSpaces();
  } catch (err) {
    alert('Ralat padam: ' + err.message);
  } finally {
    spacePendingDelete = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSpaces();

  document.getElementById('fab-add-btn').addEventListener('click', () => {
    window.location.href = 'space_form.html';
  });

  document.getElementById('space-delete-cancel-btn').addEventListener('click', () => {
    document.getElementById('space-delete-modal-overlay').classList.remove('open');
    spacePendingDelete = null;
  });
  document.getElementById('space-delete-confirm-btn').addEventListener('click', confirmDeleteSpace);

  syncAdminBottomNavBadge('bottom-nav-container', 1);
  syncAdminDrawerBadge('drawer-container');
  document.getElementById('drawer-menu-btn').addEventListener('click', openDrawer);
});