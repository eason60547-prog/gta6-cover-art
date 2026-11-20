// Vice Coast Cover Studio — the cover engine.
// Draws the multi-panel poster onto any canvas: six layouts, five colour
// grades, Anton title lettering with a neon Pacifico subtitle, a badge pill,
// a 5-star heat meter, grain, vignette, halftone dots and ink borders.
// Everything is drawn with the 2D canvas API; no image leaves the machine.

export const LAYOUTS = {
  nine: { label: 'Nine-panel grid', photos: 8 },
  'hero-three': { label: 'Hero + three', photos: 4 },
  four: { label: 'Four-panel', photos: 4 },
  full: { label: 'Full-bleed', photos: 1 },
  tilted: { label: 'Tilted snapshots', photos: 3 },
  diptych: { label: 'Diptych', photos: 2 },
};

export const GRADES = {
  sunset: { label: 'Vice Sunset', top: 'rgba(255, 122, 89, 0.16)', bottom: 'rgba(255, 0, 110, 0.30)', glow: '#ff7a59' },
  neon: { label: 'Neon Nights', top: 'rgba(255, 45, 149, 0.22)', bottom: 'rgba(0, 229, 255, 0.24)', glow: '#ff2d95' },
  gold: { label: 'Palm Gold', top: 'rgba(255, 183, 77, 0.20)', bottom: 'rgba(255, 110, 0, 0.30)', glow: '#ffb74d' },
  mono: { label: 'Mono Ink', top: 'rgba(255, 255, 255, 0.05)', bottom: 'rgba(0, 0, 0, 0.18)', glow: '#ffffff' },
  ocean: { label: 'Ocean Drive', top: 'rgba(0, 229, 255, 0.18)', bottom: 'rgba(0, 40, 120, 0.34)', glow: '#00e5ff' },
};

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
  '1080x1920': [1080, 1920],
};

/** How many photo panels a layout holds. */
export function photoSlots(layout) {
  return (LAYOUTS[layout] ?? LAYOUTS.nine).photos;
}

/** Panel rectangles for a layout, as fractions of the canvas. A rect may carry
 *  `title: true` (the centre title block) or `tilt` (radians, snapshots). */
export function panelRects(layout, w, h) {
  const gap = 0.012 * Math.min(w, h);
  const panels = [];
  if (layout === 'nine') {
    const cw = w / 3;
    const ch = h / 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const rect = { x: c * cw + gap / 2, y: r * ch + gap / 2, w: cw - gap, h: ch - gap };
        if (r === 1 && c === 1) rect.title = true;
        panels.push(rect);
      }
    }
    return panels;
  }
  if (layout === 'hero-three') {
    const heroW = w * 0.66;
    panels.push({ x: gap / 2, y: gap / 2, w: heroW - gap, h: h - gap });
    const sideX = heroW + gap / 2;
    const sideW = w - heroW - gap;
    const sh = h / 3;
    for (let i = 0; i < 3; i++) {
      panels.push({ x: sideX, y: i * sh + gap / 2, w: sideW - gap, h: sh - gap });
    }
    return panels;
  }
  if (layout === 'four') {
    const cw = w / 2;
    const ch = h / 2;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        panels.push({ x: c * cw + gap / 2, y: r * ch + gap / 2, w: cw - gap, h: ch - gap });
      }
    }
    return panels;
  }
  if (layout === 'full') {
    return [{ x: 0, y: 0, w, h }];
  }
  if (layout === 'tilted') {
    const pw = w * 0.52;
    const ph = h * 0.52;
    return [
      { x: w * 0.06, y: h * 0.07, w: pw, h: ph, tilt: -0.09 },
      { x: w * 0.42, y: h * 0.24, w: pw, h: ph, tilt: 0.07 },
      { x: w * 0.20, y: h * 0.46, w: pw, h: ph, tilt: -0.03 },
    ];
  }
  // diptych
  const hw = w / 2;
  return [
    { x: gap / 2, y: gap / 2, w: hw - gap, h: h - gap },
    { x: hw + gap / 2, y: gap / 2, w: hw - gap, h: h - gap },
  ];
}

/** Where the title block goes for layouts without a centre cell. */
export function titleRect(layout, w, h) {
  if (layout === 'nine') return null; // the centre cell is the title block
  if (layout === 'tilted') return { x: w * 0.06, y: h * 0.015, w: w * 0.88, h: h * 0.10 };
  if (layout === 'full') return { x: w * 0.05, y: h * 0.68, w: w * 0.90, h: h * 0.28 };
  return { x: w * 0.04, y: h * 0.80, w: w * 0.92, h: h * 0.17 };
}

function fitFont(ctx, text, family, maxWidth, startSize, minSize) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
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

/** The badge pill, the Anton title, the neon Pacifico subtitle and the stars.
 *  The whole stack is measured first and shrunk to fit inside the block, so
 *  nothing ever spills onto the photos below it. */
export function drawTitleBlock(ctx, rect, state, grade) {
  const { x, y, w, h } = rect;
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, '#1b0b2e');
  bg.addColorStop(1, '#0a0514');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = Math.max(1, w * 0.004);
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  const pad = w * 0.06;
  const cx = x + w / 2;
  const badgeText = (state.badge || 'VICE COAST').toUpperCase();
  const title = (state.title || 'VICE COAST').toUpperCase();
  const sub = state.subtitle || '';

  // Measure the stack, then shrink it as one piece until it fits the block.
  let badgeH = h * 0.16;
  let gap = h * 0.07;
  let titleSize = fitFont(ctx, title, 'Anton, sans-serif', w - pad * 2, h * 0.26, 10);
  let subSize = sub ? fitFont(ctx, sub, 'Pacifico, cursive', w - pad * 2, h * 0.13, 8) : 0;
  let starR = Math.min(h * 0.06, w * 0.04);
  let stack = badgeH + gap + titleSize + gap * 0.7 + subSize + gap + starR * 2;
  if (stack > h * 0.92) {
    const k = (h * 0.92) / stack;
    badgeH *= k;
    gap *= k;
    titleSize *= k;
    subSize *= k;
    starR *= k;
    stack = h * 0.92;
  }
  let cy = y + (h - stack) / 2;

  // Badge pill.
  const badgeFont = Math.max(8, badgeH * 0.55);
  ctx.font = `${badgeFont}px Anton, sans-serif`;
  const bw = ctx.measureText(badgeText).width + pad * 1.6;
  const pill = ctx.createLinearGradient(cx - bw / 2, cy, cx + bw / 2, cy);
  pill.addColorStop(0, '#ff2d95');
  pill.addColorStop(1, '#ff7a18');
  roundRect(ctx, cx - bw / 2, cy, bw, badgeH, badgeH / 2);
  ctx.fillStyle = pill;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, cx, cy + badgeH / 2 + 1);
  cy += badgeH + gap;

  // Title in Anton, with a sunset gradient fill.
  ctx.font = `${titleSize}px Anton, sans-serif`;
  const grad = ctx.createLinearGradient(cx, cy, cx, cy + titleSize);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, '#ffd166');
  grad.addColorStop(1, grade.glow);
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = titleSize * 0.12;
  ctx.fillText(title, cx, cy + titleSize / 2);
  ctx.shadowBlur = 0;
  cy += titleSize + gap * 0.7;

  // Subtitle in Pacifico, glowing neon script.
  if (sub) {
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.glow;
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = subSize * 0.55;
    ctx.fillText(sub, cx, cy + subSize / 2);
    ctx.shadowBlur = 0;
    cy += subSize + gap;
  }

  // Heat meter: five stars, filled up to state.heat.
  const starGap = starR * 2.5;
  const totalW = starGap * 4 + starR * 2;
  let sx = cx - totalW / 2 + starR;
  const sy = cy + starR;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, sx, sy, starR, i < state.heat ? '#ffd166' : 'rgba(255, 255, 255, 0.22)');
    sx += starGap;
  }
  ctx.textBaseline = 'alphabetic';
}

/** Cover-fits one photo into a rect, honouring its pan (0..1) and zoom. */
export function drawPhotoInto(ctx, img, rect, pan) {
  if (!img) return;
  const zoom = pan?.zoom ?? 1;
  const panX = pan?.panX ?? 0.5;
  const panY = pan?.panY ?? 0.5;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const maxDX = Math.max(0, (pw - rect.w) / 2);
  const maxDY = Math.max(0, (ph - rect.h) / 2);
  const dx = rect.x + (rect.w - pw) / 2 + (panX - 0.5) * 2 * maxDX;
  const dy = rect.y + (rect.h - ph) / 2 + (panY - 0.5) * 2 * maxDY;
  ctx.drawImage(img, dx, dy, pw, ph);
}

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function grain(ctx, w, h) {
  const rand = seededRandom(20261120);
  const count = Math.floor((w * h) / 900);
  for (let i = 0; i < count; i++) {
    const a = rand() * 0.16;
    ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    ctx.fillRect(rand() * w, rand() * h, 1.6, 1.6);
  }
}

function halftone(ctx, w, h) {
  const step = Math.max(14, w * 0.016);
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const r = step * 0.16 + ((row + col) % 3) * step * 0.06;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.beginPath();
      ctx.arc(col * step + step / 2, row * step + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function vignette(ctx, w, h) {
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Draws the whole cover onto `canvas` at its own pixel size.
 * `state` holds layout, grade, title, subtitle, badge, heat and panels
 * (one { photo, panX, panY, zoom } per photo slot); `photos` is the array of
 * loaded images (or nulls) those panels point at.
 */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const mono = state.grade === 'mono';

  // Backdrop gradient behind the panels.
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#2b0f3d');
  bg.addColorStop(0.5, '#12081f');
  bg.addColorStop(1, '#05030a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(state.layout, w, h);
  const ink = Math.max(2, Math.min(w, h) * 0.006);
  let slot = 0;
  for (const rect of rects) {
    if (rect.title) {
      drawTitleBlock(ctx, rect, state, grade);
      continue;
    }
    const panel = state.panels?.[slot] ?? { photo: slot % Math.max(1, photos.length), panX: 0.5, panY: 0.5, zoom: 1 };
    const img = photos[panel.photo] ?? null;
    ctx.save();
    if (rect.tilt) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.tilt);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      ctx.fillStyle = '#f5efe4';
      ctx.fillRect(-ink * 2, -ink * 2, rect.w + ink * 4, rect.h + ink * 4);
      ctx.beginPath();
      ctx.rect(0, 0, rect.w, rect.h);
      ctx.clip();
      if (mono) ctx.filter = 'grayscale(1) contrast(1.12) brightness(1.04)';
      drawPhotoInto(ctx, img, { x: 0, y: 0, w: rect.w, h: rect.h }, panel);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      if (mono) ctx.filter = 'grayscale(1) contrast(1.12) brightness(1.04)';
      drawPhotoInto(ctx, img, rect, panel);
      ctx.restore();
    }
    // Ink border around the panel.
    ctx.save();
    if (rect.tilt) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.tilt);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      ctx.strokeStyle = '#0a0514';
      ctx.lineWidth = ink;
      ctx.strokeRect(0, 0, rect.w, rect.h);
    } else {
      ctx.strokeStyle = '#0a0514';
      ctx.lineWidth = ink;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
    slot++;
  }

  // Colour grade wash over the whole cover.
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  if (mono) halftone(ctx, w, h);

  // Title band for layouts whose title is not a centre cell.
  const tr = titleRect(state.layout, w, h);
  if (tr) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = Math.min(w, h) * 0.02;
    drawTitleBlock(ctx, tr, state, grade);
    ctx.restore();
  }

  grain(ctx, w, h);
  vignette(ctx, w, h);

  // Outer frame.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.004);
  ctx.strokeRect(1, 1, w - 2, h - 2);
}
