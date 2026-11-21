// Vice Coast Cover Studio — wires the editor page, v3 "Classic Nine".
//
// This is a hand-written rewrite for the v3 entry. Everything in v2 is
// still here — sample loading, every control wired to the cover engine,
// undo/redo history, PNG export, the ?shot= scenes (see shots.js),
// the Spotlight layout, the Shuffle button, the keyboard shortcuts and
// the watermark toggle — and v3 adds:
//
//   * The Classic Nine default: the editor opens on the nine-panel
//     grid, and its eight panels are dealt from the explicit scene map
//     in cover.js (CLASSIC_NINE_SCENES), not from a plain 0-1-2-3 cycle.
//   * "Swap samples": a button (and the W key) that rotates the scene
//     map by one step, so one tap gives a visibly different cover.
//     Swaps are undoable, like everything else.
//   * Onboarding: the three-step strip in the page header ("1 Drop your
//     photos — 2 Pick a look — 3 Export PNG") and a big "Add your
//     photos" button over the preview, wired to the same file picker as
//     the Photos group, so the upload entry is obvious at first glance.
//   * A fourth one-click look, "Classic Nine", which is also the
//     default look: nine-panel grid, Vice Sunset grade, the classic
//     wording. The old "Sunset Hero" preset is the same recipe under
//     its old name and is kept as an alias, so nothing that worked in
//     v2 stops working.
//
// The state object is the single source of truth: layout, grade, size,
// words, heat, watermark, sceneOffset (how many times the scene map has
// been rotated) and one panel record per slot. The cover is a pure
// function of that state plus the loaded photos, which is why undo and
// redo can work by snapshotting the state as JSON.

import { drawCover, photoSlots, panelRects, LAYOUTS, GRADES, SIZES, CLASSIC_NINE_SCENES, rotateSceneMap, SCENE_NAMES } from './cover.js';
import { runShot } from './shots.js';

// The four sample photos, in the order the scene map expects them:
// 0 neon street, 1 rooftop dusk, 2 boulevard, 3 pier. The order
// matters — CLASSIC_NINE_SCENES is written against these indexes —
// so do not reorder this list without updating the map in cover.js.
const SAMPLES = [
  { src: 'samples/neon-street.webp', name: 'Neon street' },
  { src: 'samples/rooftop-dusk.webp', name: 'Rooftop dusk' },
  { src: 'samples/boulevard.jpg', name: 'Boulevard' },
  { src: 'samples/pier.jpg', name: 'Pier' },
];

// One-click looks: a finished cover in one tap — layout, grade and
// words together, so the first thing a new user sees is a striking
// poster, not an empty editor. "Classic Nine" is the v3 default and
// the look the screenshots are taken in; "Sunset Hero" is the same
// recipe under its v2 name, kept so the v2 preset still exists.
const PRESETS = [
  { id: 'classic-nine', label: 'Classic Nine', layout: 'nine', grade: 'sunset', title: 'VICE COAST', subtitle: 'Neon nights, palm dreams', badge: 'VICE COAST', heat: 5 },
  { id: 'neon-nights', label: 'Neon Nights', layout: 'hero-three', grade: 'neon', title: 'NEON NIGHTS', subtitle: 'Vice after dark', badge: 'NEON', heat: 5 },
  { id: 'sunset-hero', label: 'Sunset Hero', layout: 'nine', grade: 'sunset', title: 'VICE COAST', subtitle: 'Neon nights, palm dreams', badge: 'VICE COAST', heat: 5 },
  { id: 'mono-ink', label: 'Mono Ink', layout: 'tilted', grade: 'mono', title: 'VICE INK', subtitle: 'Black and white heat', badge: 'VICE INK', heat: 4 },
];

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');

// The default state is the v3 hero: the Classic Nine grid in Vice
// Sunset, at the landscape size the screenshots use, with the scene
// map unrotated (offset 0).
const DEFAULT_STATE = {
  layout: 'nine',
  grade: 'sunset',
  size: '1920x1080',
  title: 'VICE COAST',
  subtitle: 'Neon nights, palm dreams',
  badge: 'VICE COAST',
  heat: 5,
  watermark: false,
  sceneOffset: 0,
  panels: [],
};

let state = structuredClone(DEFAULT_STATE);
let photos = [];
let selectedPanel = 0;
let undoStack = [];
let redoStack = [];
let editArmed = false;
let activePreset = 'classic-nine';

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The default panels for a layout. For the nine-panel grid the photos
 *  are dealt from the Classic Nine scene map (rotated by the current
 *  sceneOffset), so the cover opens composed rather than cycled: the
 *  neon street and the rooftop dusk flank the centre title, no scene
 *  touches itself, and the four corners are four different scenes.
 *  Every other layout deals photos in order, wrapping around when the
 *  panels outnumber the photos. */
function defaultPanels(layout) {
  const count = photoSlots(layout);
  const photoCount = Math.max(1, photos.length || SAMPLES.length);
  if (layout === 'nine') {
    const map = rotateSceneMap(state.sceneOffset ?? 0);
    return Array.from({ length: count }, (_, i) => ({
      photo: map[i] % photoCount,
      panX: 0.5,
      panY: 0.5,
      zoom: 1,
    }));
  }
  return Array.from({ length: count }, (_, i) => ({
    photo: i % photoCount,
    panX: 0.5,
    panY: 0.5,
    zoom: 1,
  }));
}

/** Grows or shrinks the panel list to fit a new layout, keeping the
 *  crops the user already set for panels that survive the change. */
function resizePanels(layout) {
  const want = photoSlots(layout);
  const next = state.panels.slice(0, want);
  while (next.length < want) {
    next.push({ photo: next.length % Math.max(1, photos.length), panX: 0.5, panY: 0.5, zoom: 1 });
  }
  state.panels = next;
}

/** A JSON snapshot of the state, for the undo/redo history. */
function snapshot() {
  return JSON.stringify(state);
}

/** Applies a one-click look: layout, grade and words together, with the
 *  panels reset so the sample photos fill the new layout. Applying a
 *  look also resets the scene offset to 0, so the Classic Nine map is
 *  back to its composed starting position. */
function applyPreset(preset) {
  pushHistory();
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.title = preset.title;
  state.subtitle = preset.subtitle;
  state.badge = preset.badge;
  state.heat = preset.heat;
  state.sceneOffset = 0;
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

/** Deals a fresh cover in one tap: a random layout, a random grade, and
 *  a random photo in every panel. The previous cover is one Undo away,
 *  so a shuffle you dislike costs nothing. When the shuffle lands on
 *  the nine-panel grid, the panels are dealt from the scene map with a
 *  random rotation, so the shuffled nine-grid is still composed rather
 *  than a plain cycle. */
function shuffleCover() {
  pushHistory();
  state.layout = pickRandom(Object.keys(LAYOUTS));
  state.grade = pickRandom(Object.keys(GRADES));
  state.sceneOffset = state.layout === 'nine' ? Math.floor(Math.random() * CLASSIC_NINE_SCENES.length) : 0;
  const slots = photoSlots(state.layout);
  const deck = photos.map((_, i) => i);
  // Shuffle the deck of photo indexes, then deal one card to each panel
  // in turn, cycling back through the deck when panels outnumber photos.
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  if (state.layout === 'nine') {
    state.panels = defaultPanels(state.layout);
  } else {
    state.panels = Array.from({ length: slots }, (_, i) => ({
      photo: deck.length ? deck[i % deck.length] : 0,
      panX: 0.5,
      panY: 0.5,
      zoom: 1,
    }));
  }
  selectedPanel = 0;
  activePreset = '';
  syncControls();
  redraw();
  statusEl.textContent = `Shuffled — ${LAYOUTS[state.layout].label} in ${GRADES[state.grade].label}. Undo brings the old cover back.`;
}

/** Rotates the Classic Nine scene map by one step: every panel takes
 *  the scene its neighbour had, and the last panel wraps around to the
 *  first panel's old scene. One tap is a visibly different cover — the
 *  neon street jumps from the top-left corner to the middle-right, the
 *  pier moves from the middle-left to the bottom-middle — which is why
 *  this is the button for the first thirty seconds: tap it a few times
 *  and watch the poster remix itself. It only changes the photo
 *  assignment, never the crops, and it is undoable like everything
 *  else. On any layout other than the nine-panel grid it switches to
 *  the grid first, because the scene map only exists there. */
function swapSamples() {
  pushHistory();
  if (state.layout !== 'nine') {
    state.layout = 'nine';
    state.sceneOffset = 0;
    state.panels = defaultPanels('nine');
  }
  state.sceneOffset = ((state.sceneOffset ?? 0) + 1) % CLASSIC_NINE_SCENES.length;
  state.panels = defaultPanels('nine');
  selectedPanel = 0;
  activePreset = '';
  syncControls();
  redraw();
  const map = rotateSceneMap(state.sceneOffset);
  const corner = SCENE_NAMES[map[0]];
  statusEl.textContent = `Samples swapped — the top-left corner is now ${corner}. Tap again for another remix.`;
}

/** Restores a snapshotted state (undo/redo) and repaints. */
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

/** Begins one editing gesture (a drag, a typing run): the first input
 *  of the gesture records history, the rest of it just updates. */
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

/** Repaints the preview canvas at the chosen export size. */
function redraw() {
  const [w, h] = SIZES[state.size] ?? SIZES['1920x1080'];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state, photos.map((p) => p.img));
}

/** Pushes the state into every control: the active layout and grade
 *  buttons, the word fields, the heat stars, the watermark checkbox,
 *  the active preset, and the panel controls below. */
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

/** Rebuilds the panel dropdowns (which panel, which photo in it, and
 *  its pan/zoom sliders) for the currently selected panel. */
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

/** Loads the four sample photos. A missing sample just leaves that
 *  slot empty; the cover still draws with whatever did load. */
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

/** Loads the user's own photos (up to four) from a file picker or a
 *  drop, replacing the current set and refilling the panels. */
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

/** Renders the cover fresh at full export resolution and downloads it
 *  as a PNG. The export never upscales the on-screen preview: it
 *  draws onto a fresh canvas at exactly the chosen size. */
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

/** Wires every control on the page to the state. */
function wireControls() {
  // The file picker in the Photos group, and the big "Add your photos"
  // button over the preview, open the same picker: the button is just
  // a label for the same hidden input, so there is one upload path,
  // reached from two places.
  document.getElementById('photos').addEventListener('change', (e) => {
    loadUserPhotos(e.target.files);
  });
  const addPhotos = document.getElementById('addPhotos');
  if (addPhotos) {
    addPhotos.addEventListener('click', () => {
      document.getElementById('photos').click();
    });
  }

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
  const swapBtn = document.getElementById('swapSamples');
  if (swapBtn) swapBtn.addEventListener('click', swapSamples);
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
 *  Ctrl/Cmd+Shift+Z (or Ctrl+Y) redoes, plain S shuffles a fresh cover
 *  and plain W swaps the samples. The shortcuts stay quiet while the
 *  cursor is inside a text field, a dropdown or a slider, so Ctrl+Z
 *  keeps meaning "undo typing" exactly where you are typing. */
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
    // Plain W swaps the samples, the keyboard twin of the Swap samples button.
    if (!mod && e.key.toLowerCase() === 'w') {
      e.preventDefault();
      swapSamples();
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

/** Builds the preset, layout and grade buttons from the tables above,
 *  so adding a look, a layout or a grade is a one-line change. */
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

/** Waits for both fonts, then paints the final frame and lets the
 *  browser settle for two animation frames. Screenshot scripts wait
 *  on this through the ?shot= scenes. */
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
  // Screenshot mode: the scene is set by the query (see shots.js), then
  // the samples load and the page paints exactly once, signalling
  // window.__shotReady so the screenshot script knows it can shoot.
  runShot(shot, params, {
    applyShot(patch) {
      state.layout = patch.layout in LAYOUTS ? patch.layout : 'nine';
      state.grade = patch.grade in GRADES ? patch.grade : 'sunset';
      state.size = patch.size in SIZES ? patch.size : '1920x1080';
      state.sceneOffset = patch.sceneOffset ?? 0;
      state.panels = defaultPanels(state.layout);
      syncControls();
    },
    loadSamples,
    redraw,
    whenReady,
  });
} else {
  // Editor: load the samples first so the first painted frame already
  // has photos in it, then wait for the fonts before the final paint.
  (async () => {
    await loadSamples();
    await whenReady();
    redraw();
    statusEl.textContent = 'Sample photos loaded — drop in your own to make it yours.';
  })();
}
