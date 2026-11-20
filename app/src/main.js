// Vice Coast Cover Studio — wires the editor page.
// Loads the sample photos, wires every control to the cover engine, keeps an
// undo/redo history, exports the cover as a PNG, and runs the ?shot= scenes
// (see shots.js) for screenshots.

import { drawCover, photoSlots, panelRects, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const SAMPLES = [
  { src: 'samples/neon-street.webp', name: 'Neon street' },
  { src: 'samples/rooftop-dusk.webp', name: 'Rooftop dusk' },
  { src: 'samples/boulevard.jpg', name: 'Boulevard' },
  { src: 'samples/pier.jpg', name: 'Pier' },
];

// One-click looks: a finished cover in one tap — layout, grade and words
// together, so the first thing a new user sees is a striking poster, not
// an empty editor.
const PRESETS = [
  { id: 'neon-nights', label: 'Neon Nights', layout: 'hero-three', grade: 'neon', title: 'NEON NIGHTS', subtitle: 'Vice after dark', badge: 'NEON', heat: 5 },
  { id: 'sunset-hero', label: 'Sunset Hero', layout: 'nine', grade: 'sunset', title: 'VICE COAST', subtitle: 'Neon nights, palm dreams', badge: 'VICE COAST', heat: 5 },
  { id: 'mono-ink', label: 'Mono Ink', layout: 'tilted', grade: 'mono', title: 'VICE INK', subtitle: 'Black and white heat', badge: 'VICE INK', heat: 4 },
];

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');

const DEFAULT_STATE = {
  layout: 'nine',
  grade: 'sunset',
  size: '1920x1080',
  title: 'VICE COAST',
  subtitle: 'Neon nights, palm dreams',
  badge: 'VICE COAST',
  heat: 5,
  watermark: false,
  panels: [],
};

let state = structuredClone(DEFAULT_STATE);
let photos = [];
let selectedPanel = 0;
let undoStack = [];
let redoStack = [];
let editArmed = false;
let activePreset = 'sunset-hero';

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function defaultPanels(layout) {
  const count = photoSlots(layout);
  return Array.from({ length: count }, (_, i) => ({
    photo: i % SAMPLES.length,
    panX: 0.5,
    panY: 0.5,
    zoom: 1,
  }));
}

function resizePanels(layout) {
  const want = photoSlots(layout);
  const next = state.panels.slice(0, want);
  while (next.length < want) {
    next.push({ photo: next.length % Math.max(1, photos.length), panX: 0.5, panY: 0.5, zoom: 1 });
  }
  state.panels = next;
}

function snapshot() {
  return JSON.stringify(state);
}

/** Applies a one-click look: layout, grade and words together, with the
 *  panels reset so the sample photos fill the new layout. */
function applyPreset(preset) {
  pushHistory();
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.title = preset.title;
  state.subtitle = preset.subtitle;
  state.badge = preset.badge;
  state.heat = preset.heat;
  state.panels = defaultPanels(state.layout);
  selectedPanel = 0;
  activePreset = preset.id;
  syncControls();
  redraw();
  statusEl.textContent = `${preset.label} look applied — export it or make it yours.`;
}

/** Picks one entry from an array at random. */
function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

/** Deals a fresh cover in one tap: a random layout, a random grade, and a
 *  random photo in every panel. The previous cover is one Undo away, so a
 *  shuffle you dislike costs nothing. */
function shuffleCover() {
  pushHistory();
  state.layout = pickRandom(Object.keys(LAYOUTS));
  state.grade = pickRandom(Object.keys(GRADES));
  const slots = photoSlots(state.layout);
  const deck = photos.map((_, i) => i);
  // Shuffle the deck of photo indexes, then deal one card to each panel in
  // turn, cycling back through the deck when panels outnumber photos.
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  state.panels = Array.from({ length: slots }, (_, i) => ({
    photo: deck.length ? deck[i % deck.length] : 0,
    panX: 0.5,
    panY: 0.5,
    zoom: 1,
  }));
  selectedPanel = 0;
  activePreset = '';
  syncControls();
  redraw();
  statusEl.textContent = `Shuffled — ${LAYOUTS[state.layout].label} in ${GRADES[state.grade].label}. Undo brings the old cover back.`;
}

function restore(json) {
  state = JSON.parse(json);
  syncControls();
  redraw();
}

/** Records the state before a change, so undo can return to it. */
function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
}

/** Begins one editing gesture (a drag, a typing run): the first input of the
 *  gesture records history, the rest of it just updates. */
function beginEdit() {
  if (!editArmed) {
    pushHistory();
    editArmed = true;
  }
}

function endEdit() {
  editArmed = false;
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  statusEl.textContent = 'Undid that change.';
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  statusEl.textContent = 'Redid that change.';
}

function redraw() {
  const [w, h] = SIZES[state.size] ?? SIZES['1920x1080'];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state, photos.map((p) => p.img));
}

function syncControls() {
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
    b.setAttribute('aria-pressed', String(b.dataset.layout === state.layout));
  });
  document.querySelectorAll('#grades button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
    b.setAttribute('aria-pressed', String(b.dataset.grade === state.grade));
  });
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const badge = document.getElementById('badge');
  const heat = document.getElementById('heat');
  const size = document.getElementById('size');
  if (title && title.value !== state.title) title.value = state.title;
  if (subtitle && subtitle.value !== state.subtitle) subtitle.value = state.subtitle;
  if (badge && badge.value !== state.badge) badge.value = state.badge;
  if (heat) heat.value = String(state.heat);
  if (size) size.value = state.size;
  const heatValue = document.getElementById('heatValue');
  if (heatValue) heatValue.textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
  const watermark = document.getElementById('watermark');
  if (watermark) watermark.checked = Boolean(state.watermark);
  document.querySelectorAll('#presets button').forEach((b) => {
    b.classList.toggle('active', b.dataset.preset === activePreset);
    b.setAttribute('aria-pressed', String(b.dataset.preset === activePreset));
  });
  syncPanelControls();
}

function syncPanelControls() {
  const panelSelect = document.getElementById('panel');
  const photoSelect = document.getElementById('panelPhoto');
  const panX = document.getElementById('panX');
  const panY = document.getElementById('panY');
  const zoom = document.getElementById('zoom');
  if (!panelSelect || !photoSelect) return;
  const count = photoSlots(state.layout);
  if (selectedPanel >= count) selectedPanel = 0;
  panelSelect.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Panel ${i + 1}`;
    panelSelect.appendChild(opt);
  }
  panelSelect.value = String(selectedPanel);
  photoSelect.innerHTML = '';
  photos.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = p.name;
    photoSelect.appendChild(opt);
  });
  const panel = state.panels[selectedPanel];
  if (panel) {
    photoSelect.value = String(panel.photo);
    if (panX) panX.value = String(panel.panX);
    if (panY) panY.value = String(panel.panY);
    if (zoom) zoom.value = String(panel.zoom);
  }
}

async function loadSamples() {
  const loaded = [];
  for (const s of SAMPLES) {
    try {
      loaded.push({ img: await loadImage(s.src), name: s.name });
    } catch {
      // A missing sample just leaves that slot empty; the cover still draws.
    }
  }
  photos = loaded;
  if (!state.panels.length) state.panels = defaultPanels(state.layout);
  resizePanels(state.layout);
  syncPanelControls();
}

async function loadUserPhotos(files) {
  const picked = [...files].slice(0, 4);
  if (!picked.length) return;
  const loaded = [];
  for (const f of picked) {
    try {
      loaded.push({ img: await loadImage(URL.createObjectURL(f)), name: f.name });
    } catch {
      // Skip a file that is not a readable image.
    }
  }
  if (!loaded.length) return;
  pushHistory();
  photos = loaded;
  state.panels = defaultPanels(state.layout);
  syncPanelControls();
  redraw();
  statusEl.textContent = `${loaded.length} photo${loaded.length > 1 ? 's' : ''} loaded.`;
}

function exportPNG() {
  const [w, h] = SIZES[state.size] ?? SIZES['1920x1080'];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state, photos.map((p) => p.img));
  off.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — the browser could not make the PNG.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Saved vice-coast-${state.size}.png (${w} x ${h}).`;
  }, 'image/png');
}

function wireControls() {
  document.getElementById('photos').addEventListener('change', (e) => {
    loadUserPhotos(e.target.files);
  });

  document.querySelectorAll('#layouts button').forEach((b) => {
    b.addEventListener('click', () => {
      if (state.layout === b.dataset.layout) return;
      pushHistory();
      state.layout = b.dataset.layout;
      activePreset = '';
      resizePanels(state.layout);
      selectedPanel = 0;
      syncControls();
      redraw();
    });
  });

  document.querySelectorAll('#grades button').forEach((b) => {
    b.addEventListener('click', () => {
      if (state.grade === b.dataset.grade) return;
      pushHistory();
      state.grade = b.dataset.grade;
      activePreset = '';
      syncControls();
      redraw();
    });
  });

  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const badge = document.getElementById('badge');
  const heat = document.getElementById('heat');
  title.addEventListener('input', () => {
    beginEdit();
    state.title = title.value;
    activePreset = '';
    redraw();
  });
  title.addEventListener('change', endEdit);
  subtitle.addEventListener('input', () => {
    beginEdit();
    state.subtitle = subtitle.value;
    activePreset = '';
    redraw();
  });
  subtitle.addEventListener('change', endEdit);
  badge.addEventListener('input', () => {
    beginEdit();
    state.badge = badge.value;
    activePreset = '';
    redraw();
  });
  badge.addEventListener('change', endEdit);
  heat.addEventListener('input', () => {
    beginEdit();
    state.heat = Number(heat.value);
    activePreset = '';
    const heatValue = document.getElementById('heatValue');
    if (heatValue) heatValue.textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
    redraw();
  });
  heat.addEventListener('change', endEdit);

  const panelSelect = document.getElementById('panel');
  const photoSelect = document.getElementById('panelPhoto');
  const panX = document.getElementById('panX');
  const panY = document.getElementById('panY');
  const zoom = document.getElementById('zoom');
  panelSelect.addEventListener('change', () => {
    selectedPanel = Number(panelSelect.value);
    syncPanelControls();
  });
  photoSelect.addEventListener('change', () => {
    pushHistory();
    state.panels[selectedPanel].photo = Number(photoSelect.value);
    redraw();
  });
  panX.addEventListener('input', () => {
    beginEdit();
    state.panels[selectedPanel].panX = Number(panX.value);
    redraw();
  });
  panX.addEventListener('change', endEdit);
  panY.addEventListener('input', () => {
    beginEdit();
    state.panels[selectedPanel].panY = Number(panY.value);
    redraw();
  });
  panY.addEventListener('change', endEdit);
  zoom.addEventListener('input', () => {
    beginEdit();
    state.panels[selectedPanel].zoom = Number(zoom.value);
    redraw();
  });
  zoom.addEventListener('change', endEdit);

  document.getElementById('size').addEventListener('change', (e) => {
    pushHistory();
    state.size = e.target.value;
    redraw();
  });

  document.getElementById('watermark').addEventListener('change', (e) => {
    pushHistory();
    state.watermark = e.target.checked;
    redraw();
    statusEl.textContent = state.watermark
      ? 'Watermark on — exports will say “Made with Vice Coast”.'
      : 'Watermark off — exports stay clean.';
  });

  document.querySelectorAll('#presets button').forEach((b) => {
    b.addEventListener('click', () => {
      const preset = PRESETS.find((p) => p.id === b.dataset.preset);
      if (preset) applyPreset(preset);
    });
  });

  // Drag photos straight onto the cover: the fastest way to make it yours.
  const preview = document.querySelector('.preview');
  if (preview) {
    preview.addEventListener('dragover', (e) => {
      e.preventDefault();
      preview.classList.add('dragging');
    });
    preview.addEventListener('dragleave', () => preview.classList.remove('dragging'));
    preview.addEventListener('drop', (e) => {
      e.preventDefault();
      preview.classList.remove('dragging');
      if (e.dataTransfer?.files?.length) loadUserPhotos(e.dataTransfer.files);
    });
  }

  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('redo').addEventListener('click', redo);
  document.getElementById('shuffle').addEventListener('click', shuffleCover);
  document.getElementById('export').addEventListener('click', exportPNG);
  wireKeyboardShortcuts();

  // Clicking a panel on the preview selects it for crop and assignment.
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * canvas.width;
    const py = ((e.clientY - r.top) / r.height) * canvas.height;
    const rects = panelRects(state.layout, canvas.width, canvas.height);
    let slot = 0;
    for (const rect of rects) {
      if (rect.title) continue;
      if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) {
        selectedPanel = slot;
        syncPanelControls();
        statusEl.textContent = `Panel ${slot + 1} selected.`;
        return;
      }
      slot++;
    }
  });
}

/** Keyboard shortcuts: arrow keys walk the panels, Ctrl/Cmd+Z undoes,
 *  Ctrl/Cmd+Shift+Z (or Ctrl+Y) redoes, and plain S shuffles a fresh cover.
 *  The shortcuts stay quiet while the cursor is inside a text field, a
 *  dropdown or a slider, so Ctrl+Z keeps meaning "undo typing" exactly
 *  where you are typing. */
function wireKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const target = e.target;
    const typing =
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable);
    if (typing) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
      return;
    }
    // Plain S deals a fresh cover, the keyboard twin of the Shuffle button.
    if (!mod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      shuffleCover();
      return;
    }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const count = photoSlots(state.layout);
    if (!count) return;
    const step = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
    selectedPanel = (selectedPanel + step + count) % count;
    syncPanelControls();
    statusEl.textContent = `Panel ${selectedPanel + 1} selected.`;
  });
}

function buildControlButtons() {
  const presetBox = document.getElementById('presets');
  for (const p of PRESETS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.preset = p.id;
    b.textContent = p.label;
    presetBox.appendChild(b);
  }
  const layoutBox = document.getElementById('layouts');
  for (const [key, def] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = key;
    b.textContent = def.label;
    layoutBox.appendChild(b);
  }
  const gradeBox = document.getElementById('grades');
  for (const [key, def] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = key;
    b.textContent = def.label;
    gradeBox.appendChild(b);
  }
}

async function whenReady() {
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('40px Pacifico'),
      document.fonts.ready,
    ]);
  } catch {
    // The cover still draws with fallback fonts if a font file fails.
  }
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

state.panels = defaultPanels(state.layout);
buildControlButtons();
wireControls();
syncControls();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, {
    applyShot(patch) {
      state.layout = patch.layout in LAYOUTS ? patch.layout : 'nine';
      state.grade = patch.grade in GRADES ? patch.grade : 'sunset';
      state.size = patch.size in SIZES ? patch.size : '1920x1080';
      state.panels = defaultPanels(state.layout);
      syncControls();
    },
    loadSamples,
    redraw,
    whenReady,
  });
} else {
  // Editor: load the samples first so the first painted frame already has
  // photos in it, then wait for the fonts before the final paint.
  (async () => {
    await loadSamples();
    await whenReady();
    redraw();
    statusEl.textContent = 'Sample photos loaded — drop in your own to make it yours.';
  })();
}
