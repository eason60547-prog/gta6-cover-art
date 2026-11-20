// Vice Coast Cover Studio — the cover renderer.
//
// Everything is drawn on one <canvas> with the 2D API: panel photos, a colour
// grade, ink borders, grain, lettering, a sticker ribbon and a five-star heat
// meter. No network, no library: the only inputs are the photos the user
// loaded (or the bundled samples) and the state object below.

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.3) contrast(1.06)',
    wash: [
      [0.0, 'rgba(255, 122, 26, 0.00)'],
      [0.55, 'rgba(255, 94, 98, 0.10)'],
      [1.0, 'rgba(214, 51, 132, 0.34)'],
    ],
    accent: '#ff5e62',
  },
  neon: {
    label: 'Neon Nights',
    filter: 'saturate(1.45) contrast(1.1)',
    wash: [
      [0.0, 'rgba(255, 45, 149, 0.28)'],
      [0.5, 'rgba(120, 40, 180, 0.08)'],
      [1.0, 'rgba(0, 229, 255, 0.26)'],
    ],
    accent: '#ff2d95',
  },
  gold: {
    label: 'Palm Gold',
    filter: 'saturate(1.2) contrast(1.04) brightness(1.04)',
    wash: [
      [0.0, 'rgba(255, 214, 90, 0.20)'],
      [0.6, 'rgba(255, 170, 40, 0.10)'],
      [1.0, 'rgba(146, 90, 10, 0.30)'],
    ],
    accent: '#f5b301',
  },
  mono: {
    label: 'Mono Ink',
    filter: 'grayscale(1) contrast(1.18) brightness(1.03)',
    wash: [
      [0.0, 'rgba(255, 255, 255, 0.06)'],
      [1.0, 'rgba(0, 0, 0, 0.22)'],
    ],
    accent: '#111111',
    halftone: true,
  },
  ocean: {
    label: 'Ocean Drive',
    filter: 'saturate(1.25) contrast(1.05)',
    wash: [
      [0.0, 'rgba(0, 229, 255, 0.22)'],
      [0.55, 'rgba(0, 150, 200, 0.08)'],
      [1.0, 'rgba(10, 40, 120, 0.32)'],
    ],
    accent: '#00c8e0',
  },
};

export const LAYOUTS = {
  nine: { label: 'Nine-Panel Grid', panels: 8 },
  hero: { label: 'Hero + Three', panels: 4 },
  four: { label: 'Four-Panel', panels: 4 },
  full: { label: 'Full-Bleed', panels: 1 },
  tilted: { label: 'Tilted Snapshots', panels: 3 },
  diptych: { label: 'Diptych Split', panels: 2 },
};

// Panel rectangles as fractions of the canvas. The centre cell of the
// nine-panel grid is reserved for the title block, so it is not a photo slot.
export function layoutRects(layout, w, h) {
  const g = 0.018; // white gutter, as a fraction of the short side
  const gw = g * Math.min(w, h);
  const gh = g * Math.min(w, h);
  const cell = (x, y, cw, ch) => ({
    x: x * w + gw / 2, y: y * h + gh / 2,
    w: cw * w - gw, h: ch * h - gh, rot: 0,
  });
  switch (layout) {
    case 'nine': {
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (r === 1 && c === 1) continue; // title block
          out.push(cell(c / 3, r / 3, 1 / 3, 1 / 3));
        }
      }
      return out;
    }
    case 'hero':
      return [
        cell(0, 0, 0.66, 1),
        cell(0.66, 0, 0.34, 1 / 3),
        cell(0.66, 1 / 3, 0.34, 1 / 3),
        cell(0.66, 2 / 3, 0.34, 1 / 3),
      ];
    case 'four':
      return [
        cell(0, 0, 0.5, 0.5), cell(0.5, 0, 0.5, 0.5),
        cell(0, 0.5, 0.5, 0.5), cell(0.5, 0.5, 0.5, 0.5),
      ];
    case 'full':
      return [{ x: 0, y: 0, w, h, rot: 0 }];
    case 'tilted': {
      const s = Math.min(w, h);
      return [
        { x: w * 0.06, y: h * 0.10, w: s * 0.52, h: s * 0.52, rot: -0.07 },
        { x: w * 0.44, y: h * 0.06, w: s * 0.50, h: s * 0.50, rot: 0.05 },
        { x: w * 0.24, y: h * 0.44, w: s * 0.54, h: s * 0.54, rot: -0.02 },
      ];
    }
    case 'diptych':
      return [cell(0, 0, 0.5, 1), cell(0.5, 0, 0.5, 1)];
    default:
      return [cell(0, 0, 1, 1)];
  }
}

// Where the title block lives for a layout, as fractions of the canvas.
export function titleZone(layout, w, h) {
  switch (layout) {
    case 'nine': return { x: w / 3, y: h / 3, w: w / 3, h: h / 3, over: false };
    case 'hero': return { x: w * 0.03, y: h * 0.72, w: w * 0.62, h: h * 0.26, over: true };
    case 'four': return { x: w * 0.5, y: h * 0.5, w: w * 0.5, h: h * 0.5, over: true, centre: true };
    case 'full': return { x: 0, y: h * 0.68, w, h: h * 0.32, over: true };
    case 'tilted': return { x: w * 0.05, y: h * 0.02, w: w * 0.9, h: h * 0.12, over: true };
    case 'diptych': return { x: 0, y: h * 0.42, w, h: h * 0.16, over: true, band: true };
    default: return { x: 0, y: h * 0.7, w, h: h * 0.3, over: true };
  }
}

export function defaultState() {
  return {
    layout: 'nine',
    grade: 'sunset',
    title: 'VICE COAST',
    subtitle: 'Neon nights, palm dreams',
    badge: 'VICE COAST',
    heat: 4,
    size: '1080x1080',
    // One slot per panel (max 8). photo = index into the photos array.
    slots: [
      { photo: 0, zoom: 1, px: 0, py: 0 },
      { photo: 1, zoom: 1, px: 0, py: 0 },
      { photo: 2, zoom: 1, px: 0, py: 0 },
      { photo: 3, zoom: 1, px: 0, py: 0 },
      { photo: 0, zoom: 1, px: 0, py: 0 },
      { photo: 1, zoom: 1, px: 0, py: 0 },
      { photo: 2, zoom: 1, px: 0, py: 0 },
      { photo: 3, zoom: 1, px: 0, py: 0 },
    ],
  };
}

export const EXPORT_SIZES = {
  '1080x1080': { label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  '1080x1350': { label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  '1920x1080': { label: 'Landscape 1920 × 1080', w: 1920, h: 1080 },
  '1080x1920': { label: 'Story 1080 × 1920', w: 1080, h: 1920 },
};

// A tiny film-grain tile, generated once and reused as a pattern.
let grainTile = null;
function grainPattern(ctx) {
  if (grainTile) return grainTile;
  const t = document.createElement('canvas');
  t.width = 140; t.height = 140;
  const tc = t.getContext('2d');
  const img = tc.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
    img.data[i + 3] = 22;
  }
  tc.putImageData(img, 0, 0);
  grainTile = ctx.createPattern(t, 'repeat');
  return grainTile;
}

function drawPhotoCover(ctx, img, rect, slot, filter) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (slot?.zoom ?? 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (slot?.px ?? 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (slot?.py ?? 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (filter) ctx.filter = filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Draws the whole cover for `state` onto `canvas` (at the canvas's own
// pixel size). `photos` is the array of loaded images. Returns the panel
// rectangles it painted, so the editor can hit-test clicks.
export function drawCover(canvas, photos, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const s = Math.min(w, h);

  // Backdrop: deep ink, so gutters and the tilted layout read as print.
  ctx.save();
  ctx.fillStyle = '#14101c';
  ctx.fillRect(0, 0, w, h);

  const rects = layoutRects(state.layout, w, h);
  const tilted = state.layout === 'tilted';
  if (tilted) {
    // A sunset wash behind the loose snapshots.
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#ff7a1a');
    bg.addColorStop(0.55, '#ff2d78');
    bg.addColorStop(1, '#5b2a9d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }

  // Photos, one per panel, with the grade's filter baked in.
  rects.forEach((r, i) => {
    const slot = state.slots[i] || { photo: i % photos.length, zoom: 1, px: 0, py: 0 };
    const img = photos[slot.photo];
    ctx.save();
    if (r.rot) {
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(r.rot);
      ctx.translate(-r.w / 2, -r.h / 2);
      drawPhotoCover(ctx, img, { x: 0, y: 0, w: r.w, h: r.h }, slot, grade.filter);
    } else if (img) {
      drawPhotoCover(ctx, img, r, slot, grade.filter);
    } else {
      ctx.fillStyle = '#241d33';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    ctx.restore();
    // White gutter + black ink border around every panel.
    ctx.save();
    if (r.rot) {
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(r.rot);
      ctx.translate(-r.w / 2, -r.h / 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, s * 0.012);
      ctx.strokeRect(0, 0, r.w, r.h);
      ctx.strokeStyle = '#0c0a12';
      ctx.lineWidth = Math.max(2, s * 0.006);
      ctx.strokeRect(s * 0.008, s * 0.008, r.w - s * 0.016, r.h - s * 0.016);
    } else {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, s * 0.012);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#0c0a12';
      ctx.lineWidth = Math.max(2, s * 0.006);
      ctx.strokeRect(r.x + s * 0.008, r.y + s * 0.008, r.w - s * 0.016, r.h - s * 0.016);
    }
    ctx.restore();
  });

  // The grade wash over the whole cover.
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  for (const [stop, colour] of grade.wash) wash.addColorStop(stop, colour);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  // Halftone dots for the Mono Ink grade.
  if (grade.halftone) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#000000';
    const step = Math.max(7, s * 0.014);
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, step * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Lettering.
  drawTitle(ctx, state, w, h, grade);

  // Sticker ribbon with the badge text, top-left, tilted.
  if (state.badge && state.badge.trim()) drawRibbon(ctx, state.badge.trim().toUpperCase(), w, h);

  // Five-star heat meter, bottom-right: gold on the left, grey on the right.
  drawHeat(ctx, state.heat, w, h, s);

  // Film grain + vignette last, over everything.
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = grainPattern(ctx);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const vig = ctx.createRadialGradient(w / 2, h / 2, s * 0.42, w / 2, h / 2, s * 0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  return rects;
}

function fitFont(ctx, text, maxWidth, startSize, family, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawTitle(ctx, state, w, h, grade) {
  const zone = titleZone(state.layout, w, h);
  const s = Math.min(w, h);
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();

  ctx.save();
  if (zone.band) {
    ctx.fillStyle = 'rgba(12, 10, 18, 0.82)';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  } else if (!zone.over) {
    // The nine-panel centre cell: a solid ink block for the title.
    const bg = ctx.createLinearGradient(zone.x, zone.y, zone.x + zone.w, zone.y + zone.h);
    bg.addColorStop(0, '#ff7a1a');
    bg.addColorStop(0.5, '#ff2d78');
    bg.addColorStop(1, '#7b2ff7');
    ctx.fillStyle = bg;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, s * 0.01);
    ctx.strokeRect(zone.x + s * 0.01, zone.y + s * 0.01, zone.w - s * 0.02, zone.h - s * 0.02);
  } else if (state.layout === 'full' || state.layout === 'hero') {
    const shade = ctx.createLinearGradient(0, zone.y, 0, zone.y + zone.h);
    shade.addColorStop(0, 'rgba(10, 8, 16, 0)');
    shade.addColorStop(1, 'rgba(10, 8, 16, 0.78)');
    ctx.fillStyle = shade;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  }

  const cx = zone.x + zone.w / 2;
  const cy = zone.y + zone.h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(-0.035);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (title) {
    const size = fitFont(ctx, title, zone.w * 0.92, zone.w * 0.24, 'Anton, sans-serif', '400');
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.14);
    ctx.strokeStyle = '#0c0a12';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeText(title, 0, -size * 0.14);
    ctx.fillText(title, 0, -size * 0.14);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  if (sub) {
    const size = fitFont(ctx, sub, zone.w * 0.88, zone.w * 0.085, 'Pacifico, cursive', '400');
    ctx.fillStyle = grade.accent === '#111111' ? '#ffffff' : '#ffd166';
    ctx.lineWidth = Math.max(2, size * 0.1);
    ctx.strokeStyle = 'rgba(12, 10, 18, 0.85)';
    ctx.strokeText(sub, 0, size * 1.1);
    ctx.fillText(sub, 0, size * 1.1);
  }
  ctx.restore();
}

function drawRibbon(ctx, text, w, h) {
  const s = Math.min(w, h);
  ctx.save();
  ctx.translate(w * 0.02, h * 0.045);
  ctx.rotate(-0.06);
  ctx.font = `400 ${Math.max(14, s * 0.032)}px Anton, sans-serif`;
  const tw = ctx.measureText(text).width;
  const pad = s * 0.03;
  const rw = tw + pad * 2;
  const rh = s * 0.062;
  ctx.fillStyle = '#ff2d78';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(rw, 0);
  ctx.lineTo(rw - rh * 0.5, rh);
  ctx.lineTo(0, rh);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, s * 0.005);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, rw / 2, rh / 2 + 1);
  ctx.restore();
}

function drawHeat(ctx, heat, w, h, s) {
  const n = Math.max(0, Math.min(5, Math.round(heat || 0)));
  const r = Math.max(8, s * 0.024);
  const gap = r * 2.35;
  const total = gap * 4 + r * 2;
  const x0 = w - total - s * 0.035;
  const y0 = h - r * 2.4;
  ctx.save();
  ctx.fillStyle = 'rgba(12, 10, 18, 0.55)';
  ctx.beginPath();
  ctx.roundRect(x0 - r * 0.9, y0 - r * 1.15, total + r * 1.8, r * 2.3, r * 0.7);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const cx = x0 + r + i * gap;
    starPath(ctx, cx, y0, r);
    ctx.fillStyle = i < n ? '#ffc93c' : '#6f6a7d';
    ctx.fill();
    ctx.strokeStyle = 'rgba(12, 10, 18, 0.9)';
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.stroke();
  }
  ctx.restore();
}
