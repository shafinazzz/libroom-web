

let catalogSpaces = [];
let lightboxImages = [];
let lightboxIndex = 0;

function escapeHtmlSpacesPage(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---- Padanan _loadSpaces() — cuma bilik aktif ----
async function loadCatalogSpaces() {
  setSpacesLoading(true);
  try {
    const { data, error } = await supabaseClient
      .from('spaces')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    catalogSpaces = data ?? [];
    renderSpacesGrid();
  } catch (err) {
    alert('Ralat ambil senarai bilik: ' + err.message);
    console.error(err);
  } finally {
    setSpacesLoading(false);
  }
}

function setSpacesLoading(isLoading) {
  document.getElementById('loading-state').style.display = isLoading ? 'flex' : 'none';
  document.getElementById('page-body').style.display = isLoading ? 'none' : 'block';
}

function rateLineHtml(label, colorHex, value) {
  return `
    <p class="space-tile__rate-label">${label}</p>
    <p class="space-tile__rate-value" style="color:${colorHex};">${escapeHtmlSpacesPage(value)}</p>
  `;
}

// ---- Padanan MasonryGridView.count itemBuilder ----
function renderSpacesGrid() {
  const grid = document.getElementById('spaces-grid');

  if (catalogSpaces.length === 0) {
    grid.innerHTML = `<div class="spaces-empty">Tiada bilik dijumpai.</div>`;
    return;
  }

  grid.innerHTML = catalogSpaces.map((space, spaceIndex) => {
    const images = (space.image_urls ?? []).map(String);

    const imagesHtml = images.length > 0
      ? `<div class="space-tile__images">${images.map((url, i) => `
          <img src="${url}" alt="${escapeHtmlSpacesPage(space.name)}" data-space-index="${spaceIndex}" data-img-index="${i}"
            onerror="this.replaceWith(Object.assign(document.createElement('div'), {
              className: 'space-tile__images-placeholder',
              innerHTML: '<span class=&quot;material-symbols-outlined&quot;>meeting_room</span>'
            }))" />
        `).join('')}</div>`
      : `<div class="space-tile__images"><div class="space-tile__images-placeholder"><span class="material-symbols-outlined">meeting_room</span></div></div>`;

    return `
      <div class="space-tile">
        ${imagesHtml}
        <div class="space-tile__body">
          <p class="space-tile__name">${escapeHtmlSpacesPage(space.name ?? '')}</p>
          <hr class="space-tile__divider" />
          ${rateLineHtml('Kadar UPSI:', '#1E88E5', `RM ${space.rate_upsi_half} (Half) / RM ${space.rate_upsi_full} (Full)`)}
          ${rateLineHtml('Kadar Agensi:', '#B8860B', `RM ${space.rate_agensi_half} (Half) / RM ${space.rate_agensi_full} (Full)`)}
          ${rateLineHtml('Kadar Swasta:', '#FF5252', `RM ${space.rate_swasta_half} (Half) / RM ${space.rate_swasta_full} (Full)`)}
          <p class="space-tile__footnote">Rujukan Sahaja</p>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.space-tile__images img').forEach((img) => {
    img.addEventListener('click', () => {
      const spaceIndex = Number(img.dataset.spaceIndex);
      const imgIndex = Number(img.dataset.imgIndex);
      const images = (catalogSpaces[spaceIndex].image_urls ?? []).map(String);
      openImageViewer(images, imgIndex);
    });
  });
}

// ============================================
// Image Lightbox Viewer — padanan _openImageViewer()
// ============================================
function openImageViewer(images, initialIndex) {
  lightboxImages = images;
  lightboxIndex = initialIndex;
  renderLightbox();
  document.getElementById('lightbox-overlay').classList.add('open');
}

function closeImageViewer() {
  document.getElementById('lightbox-overlay').classList.remove('open');
}

function renderLightbox() {
  const total = lightboxImages.length;
  const url = lightboxImages[lightboxIndex];

  document.getElementById('lightbox-img').src = url;
  document.getElementById('lightbox-img').classList.remove('zoomed');
  document.getElementById('lightbox-counter').textContent =
    total > 1 ? `${total} gambar - leret untuk lihat lain` : '';
  document.getElementById('lightbox-prev-btn').style.display = total > 1 ? 'flex' : 'none';
  document.getElementById('lightbox-next-btn').style.display = total > 1 ? 'flex' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  loadCatalogSpaces();
  renderAppBottomNav('bottom-nav-container', new URLSearchParams(window.location.search).get('role') ?? 'guest', 1);

  document.getElementById('lightbox-close-btn').addEventListener('click', closeImageViewer);
  document.getElementById('lightbox-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox-overlay') closeImageViewer();
  });

  document.getElementById('lightbox-prev-btn').addEventListener('click', () => {
    lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    renderLightbox();
  });
  document.getElementById('lightbox-next-btn').addEventListener('click', () => {
    lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
    renderLightbox();
  });

  // ---- Padanan InteractiveViewer (pinch zoom) — versi ringkas: klik untuk toggle zoom ----
  document.getElementById('lightbox-img').addEventListener('click', (e) => {
    e.target.classList.toggle('zoomed');
  });

  // Padanan UserDrawer(role: widget.role)
  const spacesRole = new URLSearchParams(window.location.search).get('role') ?? 'guest';
  renderUserDrawer('drawer-container', spacesRole);
  document.getElementById('drawer-menu-btn').addEventListener('click', openUserDrawer);
});