// Vice Coast Cover Studio — wiring: state, controls, undo/redo, export.
//
// The page is one canvas plus a control column. Every change flows through
// `commit()`, which snapshots history, redraws the preview, and refreshes the
// controls. A `?shot=` query instead sets up a fixed scene for a screenshot
// (see shots.js). The app makes zero network requests: photos, fonts and code
// are all local files.
import { drawCover, defaultState, panelCount, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const $ = (id) => document.getElementById(id);

let state = defaultState();
let images = [];
let history = [];
let future = [];

const imageCache = new Map();

/** Loads an image from a URL (or data URL), resolving once it can be drawn. */
export function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

/** Makes sure every photo in state has a loaded image, in order. */
export async function ensurePhotos() {
  images = await Promise.all(state.photos.map((p) => loadImage(p.src).catch(() => null)));
  return images;
}

function snapshot() {
  return JSON.parse(JSON.stringify(state));
}

function pushHistory() {
  history.push(snapshot());
  if (history.length > 50) history.shift();
  future = [];
  refreshHistoryButtons();
}

function refreshHistoryButtons() {
  $('undo').disabled = history.length === 0;
  $('redo').disabled = future.length === 0;
}

/** Redraws the preview canvas at the current export size. */
export async function redraw() {
  const size = SIZES.find((s) => s.id === state.size) ?? SIZES[0];
  if (canvas.width !== size.w) canvas.width = size.w;
  if (canvas.height !== size.h) canvas.height = size.h;
  await ensurePhotos();
  try {
    await document.fonts.load(`100px Anton`);
    await document.fonts.load(`40px Pacifico`);
  } catch { /* fall back to system fonts if a vendored font fails */ }
  drawCover(canvas, state, images);
  refreshPanelControls();
}

function setStatus(text) {
  status.textContent = text;
}

/** Applies a state change: history, preview, controls. */
function commit(mutator, label) {
  pushHistory();
  mutator(state);
  syncPanelsToLayout();
  redraw();
  refreshControls();
  if (label) setStatus(label);
}

function syncPanelsToLayout() {
  const n = panelCount(state.layout);
  while (state.panels.length < n) {
    const i = state.panels.length;
    state.panels.push({ photo: i % Math.max(1, state.photos.length), panX: 0, panY: 0, zoom: 100 });
  }
  state.panels.length = n;
}

// ---------- controls ----------

function buildChoices() {
  const layoutBox = $('layouts');
  layoutBox.innerHTML = '';
  for (const l of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = l.id;
    b.innerHTML = '';
    const name = document.createElement('span');
    name.textContent = l.name;
    const blurb = document.createElement('small');
    blurb.textContent = l.blurb;
    b.append(name, blurb);
    b.addEventListener('click', () => commit((s) => { s.layout = l.id; }, `Layout: ${l.name}`));
    layoutBox.append(b);
  }
  const gradeBox = $('grades');
  gradeBox.innerHTML = '';
  for (const g of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = g.id;
    const name = document.createElement('span');
    name.textContent = g.name;
    const blurb = document.createElement('small');
    blurb.textContent = g.blurb;
    b.append(name, blurb);
    b.addEventListener('click', () => commit((s) => { s.grade = g.id; }, `Grade: ${g.name}`));
    gradeBox.append(b);
  }
}

function refreshControls() {
  for (const b of $('layouts').querySelectorAll('button')) {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  }
  for (const b of $('grades').querySelectorAll('button')) {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  }
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('badge').value = state.badge;
  $('heat').value = String(state.heat);
  $('heatStars').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
  $('size').value = state.size;
  renderThumbs();
  refreshPanelControls();
}

function renderThumbs() {
  const box = $('thumbs');
  box.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = photo.name;
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.name;
    b.append(img);
    if (state.photos.length > 1) {
      const rm = document.createElement('span');
      rm.className = 'rm';
      rm.textContent = '×';
      rm.title = 'Remove this photo';
      rm.addEventListener('click', (e) => {
        e.stopPropagation();
        commit((s) => {
          s.photos.splice(i, 1);
          for (const p of s.panels) {
            if (p.photo === i) p.photo = 0;
            else if (p.photo > i) p.photo -= 1;
          }
        }, `Removed ${photo.name}`);
      });
      b.append(rm);
    }
    b.addEventListener('click', () => {
      const sel = Number($('panelSelect').value || 0);
      commit((s) => { s.panels[sel].photo = i; }, `Panel ${sel + 1} ← ${photo.name}`);
    });
    box.append(b);
  });
}

let selectedPanel = 0;

function refreshPanelControls() {
  const n = panelCount(state.layout);
  if (selectedPanel >= n) selectedPanel = 0;
  const sel = $('panelSelect');
  if (sel.options.length !== n) {
    sel.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = `Panel ${i + 1}`;
      sel.append(o);
    }
  }
  sel.value = String(selectedPanel);
  const photoSel = $('panelPhoto');
  photoSel.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = photo.name;
    photoSel.append(o);
  });
  const setting = state.panels[selectedPanel] ?? { photo: 0, panX: 0, panY: 0, zoom: 100 };
  photoSel.value = String(setting.photo);
  $('panX').value = String(setting.panX);
  $('panY').value = String(setting.panY);
  $('zoom').value = String(setting.zoom);
}

// ---------- events ----------

$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
// Snapshot on focus, before the edit, so undo restores the pre-edit text.
for (const id of ['title', 'subtitle', 'badge']) $(id).addEventListener('focus', () => pushHistory());
$('heat').addEventListener('input', (e) => {
  state.heat = Number(e.target.value);
  $('heatStars').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
  redraw();
});
$('heat').addEventListener('focus', () => pushHistory());
$('size').addEventListener('change', (e) => {
  commit((s) => { s.size = e.target.value; }, `Export size: ${e.target.value}`);
});

$('panelSelect').addEventListener('change', (e) => {
  selectedPanel = Number(e.target.value);
  refreshPanelControls();
});
$('panelPhoto').addEventListener('change', (e) => {
  commit((s) => { s.panels[selectedPanel].photo = Number(e.target.value); });
});
$('panX').addEventListener('input', (e) => { state.panels[selectedPanel].panX = Number(e.target.value); redraw(); });
$('panY').addEventListener('input', (e) => { state.panels[selectedPanel].panY = Number(e.target.value); redraw(); });
$('zoom').addEventListener('input', (e) => { state.panels[selectedPanel].zoom = Number(e.target.value); redraw(); });
for (const id of ['panX', 'panY', 'zoom']) $(id).addEventListener('focus', () => pushHistory());

$('undo').addEventListener('click', () => {
  if (!history.length) return;
  future.push(snapshot());
  state = history.pop();
  images = [];
  redraw();
  refreshControls();
  refreshHistoryButtons();
  setStatus('Undid the last change.');
});
$('redo').addEventListener('click', () => {
  if (!future.length) return;
  history.push(snapshot());
  state = future.pop();
  images = [];
  redraw();
  refreshControls();
  refreshHistoryButtons();
  setStatus('Redid the change.');
});

$('photoInput').addEventListener('change', async (e) => {
  const files = [...e.target.files].slice(0, 4 - state.photos.length);
  if (!files.length) {
    setStatus(state.photos.length >= 4 ? 'Already at 4 photos — remove one first.' : 'No photo chosen.');
    return;
  }
  const added = [];
  for (const file of files) {
    const dataUrl = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });
    added.push({ name: file.name.replace(/\.[^.]+$/, '') || 'photo', src: dataUrl });
  }
  commit((s) => { s.photos.push(...added); }, `Added ${added.length} photo${added.length > 1 ? 's' : ''}.`);
  e.target.value = '';
});

$('export').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved vice-coast-${state.size}.png`);
  }, 'image/png');
});

// ---------- boot ----------

buildChoices();
refreshControls();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    applyShot(patch) {
      Object.assign(state, patch);
      syncPanelsToLayout();
      refreshControls();
    },
    ensurePhotos,
    redraw,
  });
} else {
  redraw();
}
