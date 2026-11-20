// Vice Coast Cover Studio — the editor.
//
// Loads the bundled fonts and sample photos, keeps one cover state, and
// redraws the canvas whenever anything changes. Clicking a panel selects it;
// thumbnails assign a photo to the selected panel; dragging pans the photo
// inside its panel and the wheel (or the zoom slider) zooms it.

import { GRADES, LAYOUTS, EXPORT_SIZES, defaultState, drawCover, layoutRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const SAMPLES = ['neon-street.webp', 'rooftop-dusk.webp', 'boulevard.jpg', 'pier.jpg'];
const SAMPLE_LABELS = ['Neon Street', 'Rooftop Dusk', 'Boulevard', 'Pier'];

const state = defaultState();
let photos = [];          // HTMLImageElement per loaded photo
let photoNames = [];      // display name per photo
let selected = 0;         // selected panel index
let lastRects = [];       // panel rects from the latest draw
let history = [];         // undo stack of serialised states
let future = [];          // redo stack

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });
}

async function loadFonts() {
  try {
    const anton = new FontFace('Anton', 'url(./fonts/Anton-Regular.ttf)');
    const pacifico = new FontFace('Pacifico', 'url(./fonts/Pacifico-Regular.ttf)');
    await anton.load();
    await pacifico.load();
    document.fonts.add(anton);
    document.fonts.add(pacifico);
    await document.fonts.ready;
  } catch (err) {
    console.warn('bundled fonts did not load, using fallbacks', err);
  }
}

function snapshot() {
  return JSON.stringify(state);
}

function pushHistory() {
  history.push(snapshot());
  if (history.length > 60) history.shift();
  future = [];
  updateUndoButtons();
}

function restore(json) {
  const next = JSON.parse(json);
  Object.assign(state, next);
  syncControls();
  redraw();
}

function updateUndoButtons() {
  document.getElementById('undo').disabled = history.length === 0;
  document.getElementById('redo').disabled = future.length === 0;
}

function redraw() {
  const size = EXPORT_SIZES[state.size] || EXPORT_SIZES['1080x1080'];
  // The editor canvas keeps the export aspect; its pixel size is capped so
  // the page stays fast, the export itself always renders full-size.
  const scale = Math.min(1, 900 / Math.max(size.w, size.h));
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  lastRects = drawCover(canvas, photos, state);
  highlightSelection();
}

function highlightSelection() {
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  const overlay = document.getElementById('selection');
  if (!overlay) return;
  const r = rects[selected];
  if (!r) { overlay.style.display = 'none'; return; }
  overlay.style.display = 'block';
  overlay.style.left = r.x + 'px';
  overlay.style.top = r.y + 'px';
  overlay.style.width = r.w + 'px';
  overlay.style.height = r.h + 'px';
  overlay.style.transform = r.rot ? `rotate(${r.rot}rad)` : 'none';
  overlay.style.transformOrigin = 'center';
}

// --- control panels -------------------------------------------------------

function buildPickers() {
  const layoutBox = document.getElementById('layouts');
  for (const [key, def] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.layout = key;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      if (state.layout === key) return;
      pushHistory();
      state.layout = key;
      selected = 0;
      syncControls();
      redraw();
    });
    layoutBox.appendChild(b);
  }
  const gradeBox = document.getElementById('grades');
  for (const [key, def] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.grade = key;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      if (state.grade === key) return;
      pushHistory();
      state.grade = key;
      syncControls();
      redraw();
    });
    gradeBox.appendChild(b);
  }
  const sizeBox = document.getElementById('sizes');
  for (const [key, def] of Object.entries(EXPORT_SIZES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.size = key;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      if (state.size === key) return;
      pushHistory();
      state.size = key;
      syncControls();
      redraw();
    });
    sizeBox.appendChild(b);
  }
}

function syncControls() {
  document.querySelectorAll('#layouts .pick').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#grades .pick').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizes .pick').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  document.getElementById('heat').value = state.heat;
  document.getElementById('heatValue').textContent = `${state.heat} / 5`;
  const slot = state.slots[selected] || { zoom: 1 };
  document.getElementById('zoom').value = slot.zoom;
  document.getElementById('zoomValue').textContent = `${Math.round(slot.zoom * 100)}%`;
  document.getElementById('panelLabel').textContent =
    `Panel ${selected + 1} of ${LAYOUTS[state.layout].panels}`;
  renderThumbs();
}

function renderThumbs() {
  const box = document.getElementById('thumbs');
  box.innerHTML = '';
  photos.forEach((img, i) => {
    const fig = document.createElement('figure');
    fig.className = 'thumb';
    const slot = state.slots[selected];
    if (slot && slot.photo === i) fig.classList.add('assigned');
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = photoNames[i] || `Photo ${i + 1}`;
    fig.appendChild(thumb);
    const cap = document.createElement('figcaption');
    cap.textContent = photoNames[i] || `Photo ${i + 1}`;
    fig.appendChild(cap);
    fig.addEventListener('click', () => {
      pushHistory();
      state.slots[selected].photo = i;
      syncControls();
      redraw();
    });
    box.appendChild(fig);
  });
  document.getElementById('uploadHint').textContent =
    photos.length >= 4 ? '4 photos loaded — replace one by uploading again.' : `${photos.length} of 4 photos loaded.`;
}

// --- uploads ---------------------------------------------------------------

async function addUploads(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  for (const file of list) {
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      if (photos.length >= 4) {
        // Replace the oldest non-default slot's photo, keeping 4 at most.
        photos.shift();
        photoNames.shift();
        for (const slot of state.slots) {
          slot.photo = Math.max(0, slot.photo - 1);
        }
      }
      photos.push(img);
      photoNames.push(file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Uploaded');
    } catch (err) {
      statusEl.textContent = `Could not read ${file.name}.`;
    }
  }
  pushHistory();
  syncControls();
  redraw();
  statusEl.textContent = `${photos.length} photo${photos.length === 1 ? '' : 's'} ready.`;
}

function wireUploads() {
  const input = document.getElementById('upload');
  input.addEventListener('change', () => {
    addUploads(input.files);
    input.value = '';
  });
  const drop = document.getElementById('dropzone');
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add('over');
  }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.remove('over');
  }));
  drop.addEventListener('drop', (e) => addUploads(e.dataTransfer.files));
}

// --- panel interaction: click to select, drag to pan, wheel to zoom --------

function panelAt(x, y) {
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

function wireCanvas() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let moved = false;

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = pos(e);
    const i = panelAt(p.x, p.y);
    if (i < 0) return;
    dragging = true;
    moved = false;
    lastX = p.x;
    lastY = p.y;
    canvas.setPointerCapture(e.pointerId);
    if (i !== selected) {
      selected = i;
      syncControls();
      redraw();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = pos(e);
    const dx = p.x - lastX;
    const dy = p.y - lastY;
    lastX = p.x;
    lastY = p.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    const r = lastRects[selected];
    const slot = state.slots[selected];
    if (!r || !slot) return;
    slot.px = Math.max(-0.5, Math.min(0.5, slot.px + dx / r.w));
    slot.py = Math.max(-0.5, Math.min(0.5, slot.py + dy / r.h));
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging && moved) pushHistory();
    dragging = false;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const slot = state.slots[selected];
    if (!slot) return;
    pushHistory();
    slot.zoom = Math.max(1, Math.min(3, slot.zoom * (e.deltaY < 0 ? 1.12 : 0.89)));
    syncControls();
    redraw();
  }, { passive: false });
}

// --- text, heat, zoom, undo/redo, export -----------------------------------

function wireControls() {
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const badge = document.getElementById('badge');
  const heat = document.getElementById('heat');
  const zoom = document.getElementById('zoom');

  title.addEventListener('input', () => { state.title = title.value; redraw(); });
  subtitle.addEventListener('input', () => { state.subtitle = subtitle.value; redraw(); });
  badge.addEventListener('input', () => { state.badge = badge.value; redraw(); });
  title.addEventListener('change', pushHistory);
  subtitle.addEventListener('change', pushHistory);
  badge.addEventListener('change', pushHistory);
  heat.addEventListener('input', () => {
    state.heat = Number(heat.value);
    document.getElementById('heatValue').textContent = `${state.heat} / 5`;
    redraw();
  });
  heat.addEventListener('change', pushHistory);
  zoom.addEventListener('input', () => {
    const slot = state.slots[selected];
    if (!slot) return;
    slot.zoom = Number(zoom.value);
    document.getElementById('zoomValue').textContent = `${Math.round(slot.zoom * 100)}%`;
    redraw();
  });
  zoom.addEventListener('change', pushHistory);

  document.getElementById('undo').addEventListener('click', () => {
    if (!history.length) return;
    future.push(snapshot());
    restore(history.pop());
    updateUndoButtons();
  });
  document.getElementById('redo').addEventListener('click', () => {
    if (!future.length) return;
    history.push(snapshot());
    restore(future.pop());
    updateUndoButtons();
  });
  document.getElementById('reset').addEventListener('click', () => {
    pushHistory();
    const fresh = defaultState();
    Object.assign(state, fresh);
    selected = 0;
    syncControls();
    redraw();
  });
  document.getElementById('export').addEventListener('click', () => {
    const size = EXPORT_SIZES[state.size] || EXPORT_SIZES['1080x1080'];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    drawCover(off, photos, state);
    off.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-coast-${size.w}x${size.h}.png`;
      a.click();
      statusEl.textContent = `Exported vice-coast-${size.w}x${size.h}.png`;
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
  });
}

// --- boot ------------------------------------------------------------------

async function boot() {
  buildPickers();
  wireUploads();
  wireCanvas();
  wireControls();
  await loadFonts();
  const params = new URLSearchParams(location.search);
  if (params.get('shot')) {
    await runShot(params, {
      loadSamples: async () => {
        photos = [];
        photoNames = [];
        for (let i = 0; i < SAMPLES.length; i++) {
          photos.push(await loadImage(`./samples/${SAMPLES[i]}`));
          photoNames.push(SAMPLE_LABELS[i]);
        }
      },
      redraw: () => { syncControls(); redraw(); },
      state,
      photos: () => photos,
    });
    window.__shotReady = true;
    return;
  }
  // Default editor view: the bundled samples already loaded.
  for (let i = 0; i < SAMPLES.length; i++) {
    try {
      photos.push(await loadImage(`./samples/${SAMPLES[i]}`));
      photoNames.push(SAMPLE_LABELS[i]);
    } catch (err) {
      console.warn('sample failed', SAMPLES[i], err);
    }
  }
  syncControls();
  redraw();
  updateUndoButtons();
}

boot();
