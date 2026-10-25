// Datos iniciales de prueba
const INITIAL_DOCUMENTS = [
  {
    id: 'doc-1',
    title: 'Declaración Jurada Form 200 (Enero)',
    client: 'Comercial Los Andes S.R.L.',
    nit: '1029384019',
    category: 'Declaración Jurada',
    year: '2026',
    location: 'Oficina',
    notes: 'Presentado en plazo con sello bancario.',
    created: '2026-02-10 10:30',
    photos: ['https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80'],
    history: [{ date: '2026-02-10 10:30', location: 'Oficina', note: 'Registro inicial' }]
  },
  {
    id: 'doc-2',
    title: 'Libro de Compras y Ventas IVA - Feb 2026',
    client: 'Comercial Los Andes S.R.L.',
    nit: '1029384019',
    category: 'Libro IVA / Compras y Ventas',
    year: '2026',
    location: 'Casa de la Contadora',
    notes: 'Llevado a casa para revisión y cierre.',
    created: '2026-03-05 09:15',
    photos: ['https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80'],
    history: [
      { date: '2026-03-05 09:15', location: 'Oficina', note: 'Procesamiento' },
      { date: '2026-03-08 16:40', location: 'Casa de la Contadora', note: 'Traslado a domicilio' }
    ]
  }
];

// Datos genéricos de la oficina contable para el recibo
const OFFICE_INFO = {
  name: 'ESTUDIO CONTABLE & ASESORÍA TRIBUTARIA',
  nit: '30928101021',
  address: 'Av. Principal #123, Oficina 402',
  phone: '+591 4 4582910 / +591 71728394',
  email: 'contacto@estudiocontable.com'
};

let documents = [...INITIAL_DOCUMENTS];
let selectedDocumentIds = new Set(); // IDs marcados para el recibo
let currentPhotos = []; // Fotos de la contadora en el modal actual
let mediaStream = null;

document.addEventListener('DOMContentLoaded', () => {
  renderDocuments();
  updateStats();
});

// Renderizar tabla principal
function renderDocuments() {
  const tbody = document.getElementById('documents-tbody');
  const emptyState = document.getElementById('empty-state');
  
  const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
  const nitFilter = document.getElementById('filter-nit').value.toLowerCase().trim();
  const selectedCategories = Array.from(document.getElementById('filter-categories').selectedOptions).map(o => o.value);
  const locationFilter = document.getElementById('filter-location').value;

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm) ||
      doc.client.toLowerCase().includes(searchTerm) ||
      doc.notes.toLowerCase().includes(searchTerm);

    const matchesNit = nitFilter === '' || doc.nit.toLowerCase().includes(nitFilter);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(doc.category);
    const matchesLocation = locationFilter === '' || doc.location === locationFilter;

    return matchesSearch && matchesNit && matchesCategory && matchesLocation;
  });

  document.getElementById('results-count').innerText = `${filteredDocs.length} documento${filteredDocs.length === 1 ? '' : 's'}`;

  if (filteredDocs.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  tbody.innerHTML = filteredDocs.map(doc => {
    const isChecked = selectedDocumentIds.has(doc.id);
    const locationBadge = getLocationBadge(doc.location, doc.id);
    const hasPhotos = doc.photos && doc.photos.length > 0;

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-200/80 ${isChecked ? 'bg-brand-50/50' : ''}">
        <td class="py-3.5 px-4 text-center">
          <input type="checkbox" value="${doc.id}" ${isChecked ? 'checked' : ''} onchange="toggleSelectDocument('${doc.id}', this)" class="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer" />
        </td>
        <td class="py-3.5 px-4">
          <div class="font-bold text-slate-800">${escapeHtml(doc.title)}</div>
          <div class="text-xs text-slate-500">${escapeHtml(doc.category)}</div>
        </td>
        <td class="py-3.5 px-4">
          <div class="font-semibold text-slate-700">${escapeHtml(doc.client)}</div>
          <div class="text-xs text-slate-500 font-mono">NIT: ${escapeHtml(doc.nit || 'S/N')}</div>
        </td>
        <td class="py-3.5 px-4 font-semibold text-slate-700">
          <span class="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded font-mono">${escapeHtml(doc.year)}</span>
        </td>
        <td class="py-3.5 px-4 text-center">
          ${locationBadge}
        </td>
        <td class="py-3.5 px-4 text-center">
          ${hasPhotos ? `
            <button onclick="viewDocument('${doc.id}')" class="inline-flex items-center text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-full transition">
              <i class="fa-solid fa-camera mr-1"></i> ${doc.photos.length}
            </button>
          ` : `<span class="text-xs text-slate-400">Sin fotos</span>`}
        </td>
        <td class="py-3.5 px-4 text-center">
          <div class="flex items-center justify-center space-x-2">
            <button onclick="viewDocument('${doc.id}')" title="Ver detalle" class="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-lg"><i class="fa-solid fa-eye"></i></button>
            <button onclick="openModal('edit', '${doc.id}')" title="Editar" class="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-lg"><i class="fa-solid fa-pen-to-square"></i></button>
            <button onclick="deleteDocument('${doc.id}')" title="Eliminar" class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Checkboxes de selección de documentos para el recibo
function toggleSelectDocument(docId, checkbox) {
  if (checkbox.checked) {
    selectedDocumentIds.add(docId);
  } else {
    selectedDocumentIds.delete(docId);
  }
  updateSelectedCounter();
  renderDocuments();
}

function toggleSelectAll(masterCheckbox) {
  const checkboxes = document.querySelectorAll('#documents-tbody input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = masterCheckbox.checked;
    if (masterCheckbox.checked) {
      selectedDocumentIds.add(cb.value);
    } else {
      selectedDocumentIds.delete(cb.value);
    }
  });
  updateSelectedCounter();
  renderDocuments();
}

function updateSelectedCounter() {
  document.getElementById('selected-count-badge').innerText = selectedDocumentIds.size;
}

// Insignia de ubicación actual
function getLocationBadge(location, docId) {
  let badgeStyle = '';
  switch (location) {
    case 'Oficina': badgeStyle = 'bg-blue-100 text-blue-800 border-blue-200'; break;
    case 'Casa de la Contadora': badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200'; break;
    case 'Casa (Gestión Pasada)': badgeStyle = 'bg-purple-100 text-purple-800 border-purple-200'; break;
    case 'Cliente': badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200'; break;
    default: badgeStyle = 'bg-slate-100 text-slate-800 border-slate-200';
  }

  return `
    <div class="relative inline-block">
      <select onchange="quickChangeLocation('${docId}', this.value)" class="cursor-pointer appearance-none text-xs font-semibold px-3 py-1.5 rounded-full border ${badgeStyle} focus:outline-none focus:ring-2 focus:ring-brand-500 pr-6">
        <option value="Oficina" ${location === 'Oficina' ? 'selected' : ''}>🏢 Oficina</option>
        <option value="Casa de la Contadora" ${location === 'Casa de la Contadora' ? 'selected' : ''}>🏠 Casa Contadora</option>
        <option value="Casa (Gestión Pasada)" ${location === 'Casa (Gestión Pasada)' ? 'selected' : ''}>📦 Casa (Pasada)</option>
        <option value="Cliente" ${location === 'Cliente' ? 'selected' : ''}>👤 Cliente</option>
      </select>
      <i class="fa-solid fa-chevron-down absolute right-2.5 top-2.5 text-[10px] pointer-events-none opacity-60"></i>
    </div>
  `;
}

// Cambio rápido de ubicación desde la tabla
function quickChangeLocation(docId, newLocation) {
  const doc = documents.find(d => d.id === docId);
  if (!doc || doc.location === newLocation) return;

  const oldLoc = doc.location;
  doc.location = newLocation;
  
  const now = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  doc.history.unshift({
    date: now,
    location: newLocation,
    note: `Cambio de ubicación (${oldLoc} -> ${newLocation})`
  });

  updateStats();
  renderDocuments();
  showToast(`Ubicación actualizada a "${newLocation}"`, 'success');
}

// GENERAR RECIBO PDF: SOLO LISTA LOS DOCUMENTOS BUSCADOS
function generatePDFReceipt() {
  if (selectedDocumentIds.size === 0) {
    showToast('Marca al menos un documento para generar el recibo.', 'warning');
    return;
  }

  // Comprobar que jsPDF esté cargado correctamente.
  const jsPDF = window.jspdf && window.jspdf.jsPDF;
  if (!jsPDF) {
    showToast('No se pudo cargar la librería PDF. Revisa tu conexión a Internet y recarga la página.', 'warning');
    console.error('jsPDF no está disponible. Comprueba los scripts CDN de index.html.');
    return;
  }

  const targetDocs = documents.filter(d => selectedDocumentIds.has(d.id));
  if (targetDocs.length === 0) {
    showToast('No se encontraron los documentos seleccionados.', 'warning');
    return;
  }

  try {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const receiptNum = 'REC-' + Date.now().toString().slice(-8);
    const currentDate = new Date().toLocaleDateString('es-BO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('RECIBO DE DOCUMENTOS BUSCADOS', 14, 20);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`N° de recibo: ${receiptNum}`, 14, 29);
    pdf.text(`Fecha: ${currentDate}`, 14, 35);
    pdf.text(`Cantidad de documentos: ${targetDocs.length}`, 14, 41);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Documentos buscados:', 14, 52);

    const rows = targetDocs.map((item, index) => [String(index + 1), item.title || 'Documento sin título']);

    // autoTable es opcional: si el plugin no carga, se genera una lista PDF básica igualmente.
    if (typeof pdf.autoTable === 'function') {
      pdf.autoTable({
        startY: 58,
        head: [['N°', 'Nombre del documento buscado']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [3, 105, 161], textColor: [255, 255, 255] },
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 160 } },
        margin: { left: 14, right: 14 }
      });
    } else {
      let y = 60;
      rows.forEach(([number, title]) => {
        const lines = pdf.splitTextToSize(`${number}. ${title}`, 180);
        if (y + lines.length * 6 > 280) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(lines, 14, y);
        y += lines.length * 6 + 3;
      });
    }

    pdf.save(`Recibo_Documentos_Buscados_${receiptNum}.pdf`);
    showToast('Recibo PDF generado con éxito.', 'success');
  } catch (error) {
    console.error('Error al generar el recibo PDF:', error);
    showToast('Ocurrió un error al generar el PDF. Revisa la consola del navegador.', 'warning');
  }
}

// Estadísticas
function updateStats() {
  document.getElementById('stat-total').innerText = documents.length;
  document.getElementById('stat-oficina').innerText = documents.filter(d => d.location === 'Oficina').length;
  document.getElementById('stat-casa-actual').innerText = documents.filter(d => d.location === 'Casa de la Contadora').length;
  document.getElementById('stat-casa-pasada').innerText = documents.filter(d => d.location === 'Casa (Gestión Pasada)').length;
  document.getElementById('stat-cliente').innerText = documents.filter(d => d.location === 'Cliente').length;
}

// Operaciones de Modal (Registro / Edición con fotos de la contadora)
function openModal(mode, docId = null) {
  const modal = document.getElementById('document-modal');
  const form = document.getElementById('doc-form');
  form.reset();
  currentPhotos = [];
  renderPhotosPreview();

  if (mode === 'edit' && docId) {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    document.getElementById('doc-id').value = doc.id;
    document.getElementById('doc-title').value = doc.title;
    document.getElementById('doc-client').value = doc.client;
    document.getElementById('doc-nit').value = doc.nit || '';
    document.getElementById('doc-category').value = doc.category;
    document.getElementById('doc-year').value = doc.year;
    document.getElementById('doc-location').value = doc.location;
    document.getElementById('doc-notes').value = doc.notes || '';
    currentPhotos = [...(doc.photos || [])];
    renderPhotosPreview();
  } else {
    document.getElementById('doc-id').value = '';
    document.getElementById('doc-year').value = new Date().getFullYear();
  }
  modal.classList.remove('hidden');
}

function closeModal() {
  stopCamera();
  document.getElementById('document-modal').classList.add('hidden');
}

function handleFormSubmit(e) {
  e.preventDefault();
  const docId = document.getElementById('doc-id').value;
  const title = document.getElementById('doc-title').value.trim();
  const client = document.getElementById('doc-client').value.trim();
  const nit = document.getElementById('doc-nit').value.trim();
  const category = document.getElementById('doc-category').value;
  const year = document.getElementById('doc-year').value;
  const location = document.getElementById('doc-location').value;
  const notes = document.getElementById('doc-notes').value.trim();
  const now = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

  if (docId) {
    const index = documents.findIndex(d => d.id === docId);
    if (index !== -1) {
      const oldLoc = documents[index].location;
      documents[index] = { ...documents[index], title, client, nit, category, year, location, notes, photos: [...currentPhotos] };
      if (oldLoc !== location) {
        documents[index].history.unshift({ date: now, location: location, note: `Ubicación cambiada de "${oldLoc}" a "${location}"` });
      }
      showToast('Documento actualizado', 'success');
    }
  } else {
    const newDoc = {
      id: 'doc-' + Date.now(),
      title, client, nit, category, year, location, notes, created: now,
      photos: [...currentPhotos],
      history: [{ date: now, location: location, note: 'Registro inicial por contadora' }]
    };
    documents.unshift(newDoc);
    showToast('Documento registrado con éxito', 'success');
  }

  closeModal();
  updateStats();
  renderDocuments();
}

function deleteDocument(docId) {
  if (confirm('¿Deseas eliminar este registro?')) {
    documents = documents.filter(d => d.id !== docId);
    selectedDocumentIds.delete(docId);
    updateSelectedCounter();
    updateStats();
    renderDocuments();
    showToast('Documento eliminado', 'warning');
  }
}

function viewDocument(docId) {
  const doc = documents.find(d => d.id === docId);
  if (!doc) return;

  document.getElementById('detail-title').innerText = doc.title;
  document.getElementById('detail-category-badge').innerText = doc.category;
  document.getElementById('detail-client-info').innerText = `Cliente: ${doc.client} | NIT: ${doc.nit || 'Sin Registrar'}`;
  document.getElementById('detail-year').innerText = doc.year;
  document.getElementById('detail-created').innerText = doc.created || 'N/A';
  document.getElementById('detail-notes').innerText = doc.notes || 'Sin observaciones.';
  document.getElementById('detail-photos-count').innerText = `${doc.photos.length} imagen(es)`;
  document.getElementById('detail-location-badge-wrapper').innerHTML = getLocationBadge(doc.location, doc.id);

  const gallery = document.getElementById('detail-photos-gallery');
  gallery.innerHTML = doc.photos.length > 0 
    ? doc.photos.map(src => `<img src="${src}" onclick="openLightbox('${src}')" class="w-16 h-16 object-cover rounded-lg border border-slate-300 cursor-pointer hover:scale-105" />`).join('')
    : `<span class="text-xs text-slate-400">Sin fotografías adjuntas</span>`;

  const historyList = document.getElementById('detail-history-list');
  historyList.innerHTML = doc.history.map(item => `
    <li class="mb-2 ml-4">
      <div class="absolute w-2.5 h-2.5 bg-brand-600 rounded-full -left-1.25 border border-white mt-1"></div>
      <time class="text-[10px] font-mono text-slate-400">${item.date}</time>
      <div class="text-xs font-semibold text-slate-800">${escapeHtml(item.location)}</div>
      <p class="text-[11px] text-slate-500">${escapeHtml(item.note)}</p>
    </li>
  `).join('');

  document.getElementById('detail-modal').classList.remove('hidden');
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.add('hidden');
}

// Cámara Web y carga de fotos para la contadora
async function startCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById('webcam-video').srcObject = mediaStream;
    document.getElementById('camera-container').classList.remove('hidden');
  } catch (err) {
    alert("No se pudo acceder a la cámara.");
  }
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  document.getElementById('camera-container').classList.add('hidden');
}

function takePhoto() {
  const video = document.getElementById('webcam-video');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0);
  currentPhotos.push(canvas.toDataURL('image/jpeg'));
  renderPhotosPreview();
  stopCamera();
}

function handleFileUpload(e) {
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      currentPhotos.push(ev.target.result);
      renderPhotosPreview();
    };
    reader.readAsDataURL(file);
  });
}

function renderPhotosPreview() {
  const container = document.getElementById('photos-preview');
  container.innerHTML = currentPhotos.length === 0 
    ? `<span id="no-photos-text" class="text-xs text-slate-400 w-full text-center">Sin imágenes adjuntas</span>`
    : currentPhotos.map((src, i) => `
        <div class="relative w-14 h-14">
          <img src="${src}" class="w-full h-full object-cover rounded-lg border" />
          <button type="button" onclick="removePhoto(${i})" class="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">×</button>
        </div>
      `).join('');
}

function removePhoto(i) {
  currentPhotos.splice(i, 1);
  renderPhotosPreview();
}

function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-modal').classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('lightbox-modal').classList.add('hidden');
}

function applyFilters() { renderDocuments(); }

function resetFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('filter-nit').value = '';
  document.getElementById('filter-categories').selectedIndex = -1;
  document.getElementById('filter-location').value = '';
  renderDocuments();
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `p-3 rounded-xl shadow-lg text-xs font-medium bg-slate-900 text-white ${type === 'success' ? 'border-l-4 border-emerald-500' : ''}`;
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])) : '';
}