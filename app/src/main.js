// Vice Coast Cover Studio — page wiring.
// Owns the editor state, the photo library, pointer panning, undo/redo and
// the PNG export. All drawing lives in cover.js; this file only decides
// *what* to draw and *when*.

import { LAYOUTS, GRADES, EXPORT_SIZES, SAMPLE_PHOTOS, defaultState, drawCover, layoutRects } from "./cover.js";
import { runShot } from "./shots.js";

const $ = (id) => document.getElementById(id);
const canvas = $("cover");
const state = defaultState();

// The photo library: sample photos first, then anything the user uploads.
const photos = []; // { name, img, url? }
let undoStack = [];
let redoStack = [];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

function images() {
  return photos.map((p) => p.img);
}

function snapshot() {
  return JSON.stringify(state);
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  syncUndoButtons();
}
function restore(json) {
  const next = JSON.parse(json);
  Object.assign(state, next);
  syncControls();
  redraw();
}
function syncUndoButtons() {
  $("undoBtn").disabled = undoStack.length === 0;
  $("redoBtn").disabled = redoStack.length === 0;
}

function redraw() {
  drawCover(canvas, state, images());
  const slot = state.slots[state.selected];
  $("selectedLabel").textContent =
    `Panel ${state.selected + 1} selected — photo “${photos[slot.photo]?.name ?? "none"}” — drag on the cover to pan, scroll to zoom.`;
  $("zoomInput").value = String(slot.zoom);
}

function fitPreview() {
  // Preview canvas keeps the export aspect ratio so the layout reads true.
  const size = EXPORT_SIZES.find((s) => s.id === state.size) ?? EXPORT_SIZES[0];
  canvas.width = size.w;
  canvas.height = size.h;
}

// ---- control builders -------------------------------------------------------

function buildChoices(el, items, current, onPick, swatchKey = null) {
  el.innerHTML = "";
  for (const item of items) {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-pressed", String(item.id === current));
    if (swatchKey && item[swatchKey]) {
      const sw = document.createElement("span");
      sw.className = "swatch";
      sw.style.background = item[swatchKey];
      b.append(sw, document.createTextNode(item.name));
    } else {
      b.textContent = item.name;
    }
    b.addEventListener("click", () => {
      pushUndo();
      onPick(item.id);
      buildChoices(el, items, item.id, onPick, swatchKey);
      redraw();
    });
    el.append(b);
  }
}

function syncControls() {
  $("titleInput").value = state.title;
  $("subtitleInput").value = state.subtitle;
  $("badgeInput").value = state.badge;
  $("heatInput").value = String(state.heat);
  $("heatStars").textContent = "★".repeat(state.heat) + "☆".repeat(5 - state.heat);
  buildChoices($("layoutChoices"), LAYOUTS, state.layout, (id) => { state.layout = id; });
  buildChoices($("gradeChoices"), GRADES, state.grade, (id) => { state.grade = id; }, "swatch");
  buildChoices($("sizeChoices"), EXPORT_SIZES, state.size, (id) => { state.size = id; fitPreview(); });
  renderThumbs();
}

function renderThumbs() {
  const box = $("thumbs");
  box.innerHTML = "";
  photos.forEach((p, i) => {
    const img = document.createElement("img");
    img.src = p.img.src;
    img.alt = p.name;
    img.title = p.name;
    img.className = state.slots.some((s) => s.photo === i) ? "assigned" : "";
    img.addEventListener("click", () => {
      pushUndo();
      state.slots[state.selected].photo = i;
      redraw();
      renderThumbs();
    });
    box.append(img);
  });
  for (let i = photos.length; i < 4; i++) {
    const d = document.createElement("div");
    d.className = "thumb-empty";
    d.textContent = "empty";
    box.append(d);
  }
}

// ---- uploads ----------------------------------------------------------------

async function addFiles(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith("image/"));
  if (!files.length) return;
  if (photos.length + files.length > 12) {
    $("status").textContent = "Keep it to 12 photos in the library.";
    return;
  }
  pushUndo();
  for (const f of files) {
    const url = URL.createObjectURL(f);
    try {
      const img = await loadImage(url);
      photos.push({ name: f.name.replace(/\.[^.]+$/, ""), img });
    } catch {
      $("status").textContent = `Could not read ${f.name}.`;
    }
  }
  renderThumbs();
  redraw();
  $("status").textContent = `${photos.length} photo${photos.length === 1 ? "" : "s"} in the library.`;
}

$("photoInput").addEventListener("change", (e) => addFiles(e.target.files));
const dropZone = $("dropZone");
dropZone.addEventListener("click", () => $("photoInput").click());
dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drag"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag");
  addFiles(e.dataTransfer.files);
});

// ---- text + grade + layout --------------------------------------------------

$("titleInput").addEventListener("input", (e) => { state.title = e.target.value; redraw(); });
$("subtitleInput").addEventListener("input", (e) => { state.subtitle = e.target.value; redraw(); });
$("badgeInput").addEventListener("input", (e) => { state.badge = e.target.value; redraw(); });
$("heatInput").addEventListener("input", (e) => {
  state.heat = Number(e.target.value);
  $("heatStars").textContent = "★".repeat(state.heat) + "☆".repeat(5 - state.heat);
  redraw();
});
$("cycleBtn").addEventListener("click", () => {
  pushUndo();
  const slot = state.slots[state.selected];
  slot.photo = (slot.photo + 1) % photos.length;
  redraw();
  renderThumbs();
});
$("fitBtn").addEventListener("click", () => {
  pushUndo();
  const slot = state.slots[state.selected];
  slot.zoom = 1; slot.x = 0; slot.y = 0;
  redraw();
});
$("zoomInput").addEventListener("input", (e) => {
  state.slots[state.selected].zoom = Number(e.target.value);
  redraw();
});

// ---- undo / redo --------------------------------------------------------------

$("undoBtn").addEventListener("click", () => {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncUndoButtons();
});
$("redoBtn").addEventListener("click", () => {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncUndoButtons();
});

// ---- pointer: select a panel, drag to pan, wheel to zoom --------------------

function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const px = ((clientX - r.left) / r.width) * canvas.width;
  const py = ((clientY - r.top) / r.height) * canvas.height;
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const rc = rects[i];
    if (px >= rc.x && px <= rc.x + rc.w && py >= rc.y && py <= rc.y + rc.h) return i;
  }
  return -1;
}

let dragging = null;
canvas.addEventListener("pointerdown", (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i === -1) return;
  if (i !== state.selected) {
    state.selected = i;
    redraw();
  }
  canvas.setPointerCapture(e.pointerId);
  // Snapshot BEFORE the drag, so undo returns to the pre-drag framing.
  dragging = { x: e.clientX, y: e.clientY, moved: false, before: snapshot() };
});
canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const r = canvas.getBoundingClientRect();
  const dx = (e.clientX - dragging.x) / r.width;
  const dy = (e.clientY - dragging.y) / r.height;
  if (Math.abs(dx) + Math.abs(dy) > 0.002) dragging.moved = true;
  if (!dragging.moved) return;
  const slot = state.slots[state.selected];
  slot.x = Math.max(-0.6, Math.min(0.6, slot.x + dx));
  slot.y = Math.max(-0.6, Math.min(0.6, slot.y + dy));
  dragging.x = e.clientX;
  dragging.y = e.clientY;
  redraw();
});
canvas.addEventListener("pointerup", (e) => {
  if (dragging?.moved) {
    undoStack.push(dragging.before);
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
    syncUndoButtons();
  }
  dragging = null;
});
canvas.addEventListener("dblclick", () => {
  pushUndo();
  const slot = state.slots[state.selected];
  slot.photo = (slot.photo + 1) % photos.length;
  redraw();
  renderThumbs();
});
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const slot = state.slots[state.selected];
  slot.zoom = Math.max(1, Math.min(3, slot.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  redraw();
}, { passive: false });

// ---- export -------------------------------------------------------------------

$("exportBtn").addEventListener("click", () => {
  const size = EXPORT_SIZES.find((s) => s.id === state.size) ?? EXPORT_SIZES[0];
  const off = document.createElement("canvas");
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state, images());
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    $("status").textContent = `Saved vice-coast-${size.w}x${size.h}.png`;
  }, "image/png");
});

// ---- boot ---------------------------------------------------------------------

async function boot() {
  fitPreview();
  syncControls();
  syncUndoButtons();
  // Load the bundled samples first so the cover is never empty.
  for (const [i, src] of SAMPLE_PHOTOS.entries()) {
    try {
      const img = await loadImage(src);
      photos.push({ name: src.split("/").pop().replace(/\.[^.]+$/, ""), img });
    } catch {
      // A missing sample just leaves that slot blank; the rest still load.
    }
  }
  // Fonts change the title metrics, so redraw once they arrive.
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('40px "Anton"'),
        document.fonts.load('40px "Pacifico"'),
      ]);
    } catch { /* fall back to system fonts */ }
  }
  const params = new URLSearchParams(location.search);
  const shot = params.get("shot");
  if (shot) {
    await runShot(shot, params, state, photos, { fitPreview, redraw, syncControls });
  } else {
    renderThumbs();
    redraw();
  }
}

boot();
