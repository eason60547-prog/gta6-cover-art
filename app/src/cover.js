// Vice Coast Cover Studio — the cover renderer.
//
// drawCover(canvas, state, images) paints one export: the layout's panels filled
// with the assigned photos, the colour grade, grain / vignette / halftone, ink
// borders, and the title block with badge and heat meter. Everything is drawn with
// the plain 2D canvas API; no image ever leaves the browser.
//
// A panel is { x, y, w, h } in fractions of the canvas, plus an optional rotation
// in degrees (tilted snapshots). A panel's photo setting is { photo, panX, panY,
// zoom }: photo is an index into the images array, pan is a percentage of the
// panel's size, zoom is a percentage (100 = cover-fit).

export const SIZES = [
  { id: '1080x1080', w: 1080, h: 1080, label: '1080 × 1080 · square' },
  { id: '1080x1350', w: 1080, h: 1350, label: '1080 × 1350 · portrait' },
  { id: '1920x1080', w: 1920, h: 1080, label: '1920 × 1080 · wide' },
  { id: '1080x1920', w: 1080, h: 1920, label: '1080 × 1920 · story' },
];

// title.mode: 'cell' paints a solid block in the grid; 'band' paints a scrim along
// the foot; 'top' paints a scrim along the head. title.rect is in fractions.
export const LAYOUTS = [
  {
    id: 'nine', name: 'Nine-Panel Grid', blurb: '3 × 3, title in the middle',
    panels: [
      { x: 0.000, y: 0.000, w: 0.333, h: 0.333 }, { x: 0.333, y: 0.000, w: 0.334, h: 0.333 },
      { x: 0.667, y: 0.000, w: 0.333, h: 0.333 }, { x: 0.000, y: 0.333, w: 0.333, h: 0.334 },
      { x: 0.667, y: 0.333, w: 0.333, h: 0.334 }, { x: 0.000, y: 0.667, w: 0.333, h: 0.333 },
      { x: 0.333, y: 0.667, w: 0.334, h: 0.333 }, { x: 0.667, y: 0.667, w: 0.333, h: 0.333 },
    ],
    title: { mode: 'cell', rect: { x: 0.333, y: 0.333, w: 0.334, h: 0.334 } },
  },
  {
    id: 'hero-three', name: 'Hero + Three', blurb: 'one big moment, three below',
    panels: [
      { x: 0.000, y: 0.000, w: 1.000, h: 0.620 },
      { x: 0.000, y: 0.620, w: 0.333, h: 0.380 }, { x: 0.333, y: 0.620, w: 0.334, h: 0.380 },
      { x: 0.667, y: 0.620, w: 0.333, h: 0.380 },
    ],
    title: { mode: 'band', rect: { x: 0.000, y: 0.620, w: 1.000, h: 0.380 } },
  },
  {
    id: 'four', name: 'Four-Panel', blurb: 'classic 2 × 2 comic grid',
    panels: [
      { x: 0.000, y: 0.000, w: 0.500, h: 0.500 }, { x: 0.500, y: 0.000, w: 0.500, h: 0.500 },
      { x: 0.000, y: 0.500, w: 0.500, h: 0.500 }, { x: 0.500, y: 0.500, w: 0.500, h: 0.500 },
    ],
    title: { mode: 'band', rect: { x: 0.000, y: 0.640, w: 1.000, h: 0.360 } },
  },
  {
    id: 'full', name: 'Full-Bleed', blurb: 'one photo, edge to edge',
    panels: [{ x: 0.000, y: 0.000, w: 1.000, h: 1.000 }],
    title: { mode: 'band', rect: { x: 0.000, y: 0.620, w: 1.000, h: 0.380 } },
  },
  {
    id: 'tilted', name: 'Tilted Snapshots', blurb: 'three prints tossed on the table',
    panels: [
      { x: 0.045, y: 0.240, w: 0.420, h: 0.520, rot: -6 },
      { x: 0.320, y: 0.300, w: 0.420, h: 0.520, rot: 4 },
      { x: 0.580, y: 0.230, w: 0.380, h: 0.500, rot: -3 },
    ],
    title: { mode: 'top', rect: { x: 0.000, y: 0.000, w: 1.000, h: 0.240 } },
  },
  {
    id: 'diptych', name: 'Diptych', blurb: 'two halves, one story',
    panels: [
      { x: 0.000, y: 0.000, w: 0.500, h: 1.000 },
      { x: 0.500, y: 0.000, w: 0.500, h: 1.000 },
    ],
    title: { mode: 'band', rect: { x: 0.000, y: 0.660, w: 1.000, h: 0.340 } },
  },
];

export const GRADES = [
  {
    id: 'sunset', name: 'Vice Sunset', blurb: 'magenta dusk, orange heat',
    top: 'rgba(255, 94, 98, 0.10)', bottom: 'rgba(255, 122, 26, 0.34)',
    tint: 'rgba(255, 60, 120, 0.10)', mono: false, halftone: false,
    titleColor: '#ffffff', accent: '#ffc93c',
  },
  {
    id: 'neon', name: 'Neon Nights', blurb: 'violet + cyan after dark',
    top: 'rgba(80, 40, 200, 0.22)', bottom: 'rgba(46, 230, 255, 0.16)',
    tint: 'rgba(140, 60, 255, 0.14)', mono: false, halftone: false,
    titleColor: '#ffffff', accent: '#2ee6ff',
  },
  {
    id: 'gold', name: 'Palm Gold', blurb: 'warm amber afternoon',
    top: 'rgba(255, 201, 60, 0.12)', bottom: 'rgba(190, 110, 10, 0.30)',
    tint: 'rgba(255, 180, 60, 0.12)', mono: false, halftone: false,
    titleColor: '#fff8e6', accent: '#ff7a1a',
  },
  {
    id: 'mono', name: 'Mono Ink', blurb: 'halftone black & white',
    top: 'rgba(0, 0, 0, 0.00)', bottom: 'rgba(0, 0, 0, 0.18)',
    tint: 'rgba(0, 0, 0, 0.00)', mono: true, halftone: true,
    titleColor: '#ffffff', accent: '#e8e8e8',
  },
  {
    id: 'ocean', name: 'Ocean Drive', blurb: 'teal water, pastel sky',
    top: 'rgba(46, 230, 255, 0.14)', bottom: 'rgba(0, 120, 160, 0.30)',
    tint: 'rgba(0, 180, 200, 0.10)', mono: false, halftone: false,
    titleColor: '#ffffff', accent: '#7df9ff',
  },
];

export const DEFAULT_TITLE = 'VICE COAST';
export const DEFAULT_SUBTITLE = 'Neon nights, palm dreams';
export const DEFAULT_BADGE = 'VICE COAST';

const PALETTE = ['#ff2e88', '#2ee6ff', '#ffc93c', '#7dff5e', '#b388ff', '#ff7a1a'];

// A small tile of random grain, reused as a repeating pattern.
let grainTile = null;
function grainPattern(ctx) {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 128; tile.height = 128;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  grainTile = ctx.createPattern(tile, 'repeat');
  return grainTile;
}

let dotTile = null;
function halftonePattern(ctx) {
  if (dotTile) return dotTile;
  const tile = document.createElement('canvas');
  tile.width = 12; tile.height = 12;
  const tctx = tile.getContext('2d');
  tctx.fillStyle = '#000';
  tctx.beginPath(); tctx.arc(6, 6, 2.1, 0, Math.PI * 2); tctx.fill();
  dotTile = ctx.createPattern(tile, 'repeat');
  return dotTile;
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

function drawPhotoInto(ctx, img, rect, setting, mono) {
  const px = rect.x, py = rect.y, pw = rect.w, ph = rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  if (!img) {
    const g = ctx.createLinearGradient(px, py, px + pw, py + ph);
    g.addColorStop(0, '#3a1748'); g.addColorStop(1, '#12081c');
    ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
    ctx.restore();
    return;
  }
  const zoom = (setting?.zoom ?? 100) / 100;
  const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const ox = (setting?.panX ?? 0) / 100 * pw;
  const oy = (setting?.panY ?? 0) / 100 * ph;
  if (mono) ctx.filter = 'grayscale(1) contrast(1.18) brightness(1.06)';
  ctx.drawImage(img, px + (pw - dw) / 2 + ox, py + (ph - dh) / 2 + oy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

function drawPanelPhoto(ctx, img, panel, setting, mono, w, h) {
  const rect = {
    x: panel.x * w, y: panel.y * h,
    w: panel.w * w, h: panel.h * h,
  };
  if (panel.rot) {
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((panel.rot * Math.PI) / 180);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    drawPhotoInto(ctx, img, { x: 0, y: 0, w: rect.w, h: rect.h }, setting, mono);
    // A white print border, like a snapshot.
    ctx.strokeStyle = '#f5f0e6';
    ctx.lineWidth = Math.max(4, rect.w * 0.02);
    ctx.strokeRect(0, 0, rect.w, rect.h);
    ctx.restore();
    return;
  }
  drawPhotoInto(ctx, img, rect, setting, mono);
}

function drawBadge(ctx, text, x, y, unit, accent) {
  if (!text) return;
  const label = text.trim().toUpperCase();
  if (!label) return;
  ctx.save();
  ctx.font = `bold ${unit * 2.1}px system-ui, sans-serif`;
  const tw = ctx.measureText(label).width;
  const padX = unit * 1.6, padY = unit * 0.9;
  const bw = tw + padX * 2, bh = unit * 3.6;
  ctx.fillStyle = 'rgba(10, 4, 18, 0.82)';
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1.5, unit * 0.22);
  roundRect(ctx, x, y, bw, bh, bh / 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + bw / 2, y + bh / 2 + unit * 0.1);
  ctx.restore();
  return bw;
}

function drawStars(ctx, heat, x, y, unit, accent) {
  ctx.save();
  ctx.font = `${unit * 3.4}px system-ui, sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  let sx = x;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < heat ? accent : 'rgba(255, 255, 255, 0.35)';
    ctx.fillText('★', sx, y);
    sx += unit * 3.6;
  }
  ctx.restore();
  return sx - x;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTitleBlock(ctx, state, grade, w, h) {
  const t = state.title.trim() || DEFAULT_TITLE;
  const sub = state.subtitle.trim();
  const rect = {
    x: state.layoutDef.title.rect.x * w,
    y: state.layoutDef.title.rect.y * h,
    w: state.layoutDef.title.rect.w * w,
    h: state.layoutDef.title.rect.h * h,
  };
  const unit = Math.min(w, h) / 100;
  ctx.save();

  if (state.layoutDef.title.mode === 'cell') {
    ctx.fillStyle = '#160a24';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, 'rgba(255, 46, 136, 0.30)');
    g.addColorStop(1, 'rgba(255, 122, 26, 0.18)');
    ctx.fillStyle = g; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = grade.accent; ctx.lineWidth = Math.max(2, unit * 0.35);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    const pad = rect.w * 0.08;
    const cx = rect.x + pad, cw = rect.w - pad * 2;
    // Badge on top.
    drawBadge(ctx, state.badge, cx, rect.y + rect.h * 0.10, unit, grade.accent);
    // Title, centred in the remaining space.
    const titleSize = fitFont(ctx, t, cw, rect.w * 0.20, "'Anton', sans-serif");
    ctx.fillStyle = grade.titleColor;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 46, 136, 0.8)'; ctx.shadowBlur = unit * 1.6;
    ctx.fillText(t, rect.x + rect.w / 2, rect.y + rect.h * 0.52);
    ctx.shadowBlur = 0;
    if (sub) {
      const subSize = fitFont(ctx, sub, cw, rect.w * 0.075, "'Pacifico', cursive");
      ctx.fillStyle = grade.accent;
      ctx.fillText(sub, rect.x + rect.w / 2, rect.y + rect.h * 0.72);
    }
    drawStars(ctx, state.heat, rect.x + rect.w / 2 - unit * 9, rect.y + rect.h * 0.88, unit, grade.accent);
  } else {
    // 'band' and 'top': a scrim the words sit on.
    const band = state.layoutDef.title.mode === 'band'
      ? ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h)
      : ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    if (state.layoutDef.title.mode === 'band') {
      band.addColorStop(0, 'rgba(10, 4, 18, 0)');
      band.addColorStop(0.45, 'rgba(10, 4, 18, 0.72)');
      band.addColorStop(1, 'rgba(10, 4, 18, 0.92)');
    } else {
      band.addColorStop(0, 'rgba(10, 4, 18, 0.92)');
      band.addColorStop(0.55, 'rgba(10, 4, 18, 0.72)');
      band.addColorStop(1, 'rgba(10, 4, 18, 0)');
    }
    ctx.fillStyle = band;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const pad = w * 0.045;
    const cw = w - pad * 2;
    const titleSize = fitFont(ctx, t, cw, h * 0.115, "'Anton', sans-serif");
    ctx.fillStyle = grade.titleColor;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'; ctx.shadowBlur = titleSize * 0.18;
    const baseY = state.layoutDef.title.mode === 'band'
      ? rect.y + rect.h - h * 0.055
      : rect.y + rect.h * 0.62;
    ctx.fillText(t, pad, baseY);
    ctx.shadowBlur = 0;
    if (sub) {
      const subSize = fitFont(ctx, sub, cw, h * 0.042, "'Pacifico', cursive");
      ctx.fillStyle = grade.accent;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; ctx.shadowBlur = subSize * 0.2;
      ctx.fillText(sub, pad, baseY - titleSize * 1.05);
      ctx.shadowBlur = 0;
    }
    // Badge top-right, stars under it.
    const bw = drawBadge(ctx, state.badge, w - pad - w * 0.20, rect.y + h * 0.03, unit, grade.accent) || 0;
    drawStars(ctx, state.heat, w - pad - unit * 18, rect.y + h * 0.03 + unit * 5.2, unit, grade.accent);
  }
  ctx.restore();
}

/** Paints the cover described by `state` onto `canvas` (sized to the export size).
 *  `images` is an array of loaded images (or nulls) parallel to state.photos. */
export function drawCover(canvas, state, images) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const grade = GRADES.find((g) => g.id === state.grade) ?? GRADES[0];
  const layout = LAYOUTS.find((l) => l.id === state.layout) ?? LAYOUTS[0];
  const unit = Math.min(w, h) / 100;
  const gap = Math.max(2, Math.round(unit * 0.7));

  // Backdrop.
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);

  // Panels.
  layout.panels.forEach((panel, i) => {
    const setting = state.panels?.[i] ?? { photo: i % (images.length || 1), panX: 0, panY: 0, zoom: 100 };
    const img = images[setting.photo] ?? null;
    const rect = {
      x: panel.x * w + (panel.x > 0 ? gap / 2 : 0),
      y: panel.y * h + (panel.y > 0 ? gap / 2 : 0),
      w: panel.w * w - (panel.x > 0 ? gap / 2 : 0) - (panel.x + panel.w < 1 ? gap / 2 : 0),
      h: panel.h * h - (panel.y > 0 ? gap / 2 : 0) - (panel.y + panel.h < 1 ? gap / 2 : 0),
    };
    if (panel.rot) {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((panel.rot * Math.PI) / 180);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      drawPhotoInto(ctx, img, { x: 0, y: 0, w: rect.w, h: rect.h }, setting, grade.mono);
      ctx.strokeStyle = '#f5f0e6';
      ctx.lineWidth = Math.max(4, rect.w * 0.02);
      ctx.strokeRect(0, 0, rect.w, rect.h);
      ctx.restore();
    } else {
      drawPhotoInto(ctx, img, rect, setting, grade.mono);
      // Ink border around the panel.
      ctx.strokeStyle = '#160a24';
      ctx.lineWidth = gap;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  });

  // Colour grade wash.
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  if (grade.tint !== 'rgba(0, 0, 0, 0.00)') {
    ctx.fillStyle = grade.tint;
    ctx.fillRect(0, 0, w, h);
  }

  // Halftone dots (Mono Ink).
  if (grade.halftone) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = halftonePattern(ctx);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Title block, badge, heat meter.
  drawTitleBlock(ctx, { ...state, layoutDef: layout }, grade, w, h);

  // Grain + vignette on top of everything.
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = grainPattern(ctx);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Outer ink frame.
  ctx.strokeStyle = '#0d0514';
  ctx.lineWidth = Math.max(4, unit * 1.1);
  ctx.strokeRect(0, 0, w, h);
}

/** A fresh default state: 4 sample photos, nine-panel grid, Vice Sunset. */
export function defaultState() {
  return {
    layout: 'nine',
    grade: 'sunset',
    size: '1080x1080',
    title: DEFAULT_TITLE,
    subtitle: DEFAULT_SUBTITLE,
    badge: DEFAULT_BADGE,
    heat: 4,
    photos: [
      { name: 'neon-street', src: 'samples/neon-street.webp' },
      { name: 'rooftop-dusk', src: 'samples/rooftop-dusk.webp' },
      { name: 'boulevard', src: 'samples/boulevard.jpg' },
      { name: 'pier', src: 'samples/pier.jpg' },
    ],
    panels: [
      { photo: 0, panX: 0, panY: 0, zoom: 100 },
      { photo: 1, panX: 0, panY: 0, zoom: 100 },
      { photo: 2, panX: 0, panY: 0, zoom: 100 },
      { photo: 3, panX: 0, panY: 0, zoom: 100 },
      { photo: 0, panX: 0, panY: 0, zoom: 100 },
      { photo: 1, panX: 0, panY: 0, zoom: 100 },
      { photo: 2, panX: 0, panY: 0, zoom: 100 },
      { photo: 3, panX: 0, panY: 0, zoom: 100 },
    ],
  };
}

/** Panel count for the layout — used to size the panels array. */
export function panelCount(layoutId) {
  return (LAYOUTS.find((l) => l.id === layoutId) ?? LAYOUTS[0]).panels.length;
}
