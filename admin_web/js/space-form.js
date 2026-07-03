/* ============================================
   Space Form
   Padanan terus dengan _SpaceFormPageState (Flutter)
   ============================================ */

let existingSpace = null; // null = mode tambah
let existingImageUrls = []; // gambar sedia ada (mode edit) — padanan _existingImageUrls
let newImageFiles = []; // File objects baru dipilih, belum upload — padanan _newImages

function getSpaceIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// ---- Padanan initState() -> load existing kalau mode edit ----
async function initSpaceForm() {
  const id = getSpaceIdFromUrl();

  if (id) {
    document.getElementById('form-title-heading').textContent = 'Edit Bilik';
    document.getElementById('submit-btn-label').textContent = 'Simpan Perubahan';
    document.title = 'Edit Bilik';

    try {
      const { data, error } = await supabaseClient
        .from('spaces')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;

      existingSpace = data;
      document.getElementById('name-input').value = data.name ?? '';
      document.getElementById('capacity-input').value = data.capacity ?? '';
      document.getElementById('facilities-input').value = data.facilities ?? '';
      document.getElementById('description-input').value = data.description ?? '';
      document.getElementById('rate-upsi-half').value = data.rate_upsi_half ?? 0;
      document.getElementById('rate-upsi-full').value = data.rate_upsi_full ?? 0;
      document.getElementById('rate-agensi-half').value = data.rate_agensi_half ?? 0;
      document.getElementById('rate-agensi-full').value = data.rate_agensi_full ?? 0;
      document.getElementById('rate-swasta-half').value = data.rate_swasta_half ?? 0;
      document.getElementById('rate-swasta-full').value = data.rate_swasta_full ?? 0;

      existingImageUrls = [...(data.image_urls ?? [])];
      renderImageStrip();
    } catch (err) {
      alert('Ralat ambil data: ' + err.message);
    }
  }
}

// ---- Padanan _imageThumb() + _buildThumbnail strip ----
function renderImageStrip() {
  const strip = document.getElementById('image-strip');

  const existingHtml = existingImageUrls.map((url, index) => `
    <div class="image-thumb">
      <img src="${url}" alt="Gambar bilik" />
      <button class="image-thumb__remove" data-remove-existing="${index}" aria-label="Padam gambar">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
  `).join('');

  const newHtml = newImageFiles.map((file, index) => `
    <div class="image-thumb">
      <img src="${URL.createObjectURL(file)}" alt="Gambar baru" />
      <button class="image-thumb__remove" data-remove-new="${index}" aria-label="Padam gambar">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
  `).join('');

  strip.innerHTML = `
    ${existingHtml}
    ${newHtml}
    <button class="image-add-btn" id="pick-image-btn" aria-label="Tambah gambar" type="button">
      <span class="material-symbols-outlined">add_photo_alternate</span>
    </button>
  `;

  document.getElementById('pick-image-btn').addEventListener('click', () => {
    document.getElementById('image-file-input').click();
  });

  strip.querySelectorAll('[data-remove-existing]').forEach((btn) => {
    btn.addEventListener('click', () => {
      existingImageUrls.splice(Number(btn.dataset.removeExisting), 1);
      renderImageStrip();
    });
  });
  strip.querySelectorAll('[data-remove-new]').forEach((btn) => {
    btn.addEventListener('click', () => {
      newImageFiles.splice(Number(btn.dataset.removeNew), 1);
      renderImageStrip();
    });
  });
}

// ---- Padanan _save() ----
async function saveSpace() {
  const name = document.getElementById('name-input').value.trim();
  if (!name) {
    alert('Nama bilik wajib diisi.');
    return;
  }

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  document.getElementById('submit-btn-label').style.display = 'none';
  document.getElementById('submit-spinner').style.display = 'inline-block';

  try {
    // ---- Upload setiap gambar baru — padanan for-loop uploadBinary() ----
    const uploadedUrls = [];
    for (let i = 0; i < newImageFiles.length; i++) {
      const file = newImageFiles[i];
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
      const fileName = `${Date.now()}_${i}.${ext}`;

      const { error: uploadErr } = await supabaseClient.storage
        .from('space-images')
        .upload(fileName, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabaseClient.storage
        .from('space-images')
        .getPublicUrl(fileName);
      uploadedUrls.push(urlData.publicUrl);
    }

    // ---- Gabung gambar sedia ada + gambar baru — padanan finalImageUrls ----
    const finalImageUrls = [...existingImageUrls, ...uploadedUrls];

    const payload = {
      name,
      capacity: document.getElementById('capacity-input').value.trim(),
      facilities: document.getElementById('facilities-input').value.trim(),
      description: document.getElementById('description-input').value.trim(),
      rate_upsi_half: parseFloat(document.getElementById('rate-upsi-half').value) || 0,
      rate_upsi_full: parseFloat(document.getElementById('rate-upsi-full').value) || 0,
      rate_agensi_half: parseFloat(document.getElementById('rate-agensi-half').value) || 0,
      rate_agensi_full: parseFloat(document.getElementById('rate-agensi-full').value) || 0,
      rate_swasta_half: parseFloat(document.getElementById('rate-swasta-half').value) || 0,
      rate_swasta_full: parseFloat(document.getElementById('rate-swasta-full').value) || 0,
      image_urls: finalImageUrls,
    };

    let error;
    if (existingSpace) {
      ({ error } = await supabaseClient.from('spaces').update(payload).eq('id', existingSpace.id));
    } else {
      payload.is_active = true;
      ({ error } = await supabaseClient.from('spaces').insert(payload));
    }
    if (error) throw error;

    window.location.href = 'space_management.html';
  } catch (err) {
    alert('Ralat simpan: ' + err.message);
    submitBtn.disabled = false;
    document.getElementById('submit-btn-label').style.display = 'inline';
    document.getElementById('submit-spinner').style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSpaceForm();
  renderImageStrip(); // papar button "+" walaupun tiada gambar lagi (mode tambah)

  document.getElementById('image-file-input').addEventListener('change', (e) => {
    const files = Array.from(e.target.files ?? []);
    newImageFiles.push(...files);
    renderImageStrip();
    e.target.value = ''; // elak isu pilih fail sama 2x tak trigger change
  });

  document.getElementById('submit-btn').addEventListener('click', saveSpace);
});