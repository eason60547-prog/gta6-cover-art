// Vice Coast Cover Studio — the cover renderer.
// Draws the whole cover onto a canvas from plain state: which layout, which
// grade, which photo sits in each panel slot (with its own pan/zoom), and the
// words. No network, no libraries — just the 2D canvas context.

export const LAYOUTS = [
  { id: "nine", name: "Nine-Panel Grid", slots: 8 },
  { id: "hero-three", name: "Hero + Three", slots: 4 },
  { id: "four", name: "Four-Panel", slots: 4 },
  { id: "full", name: "Full-Bleed", slots: 1 },
  { id: "tilted", name: "Tilted Snapshots", slots: 3 },
  { id: "diptych", name: "Diptych Split", slots: 2 },
];

export const GRADES = [
  { id: "sunset", name: "Vice Sunset", swatch: "linear-gradient(135deg,#ff7a1a,#ff2e88)" },
  { id: "neon", name: "Neon Nights", swatch: "linear-gradient(135deg,#ff2e88,#2ee6c8)" },
  { id: "gold", name: "Palm Gold", swatch: "linear-gradient(135deg,#ffc93c,#ff7a1a)" },
  { id: "mono", name: "Mono Ink", swatch: "linear-gradient(135deg,#eee,#111)" },
  { id: "ocean", name: "Ocean Drive", swatch: "linear-gradient(135deg,#2ee6c8,#2563eb)" },
];

export const EXPORT_SIZES = [
  { id: "1080x1080", name: "Square · 1080×1080", w: 1080, h: 1080 },
  { id: "1080x1350", name: "Portrait · 1080×1350", w: 1080, h: 1350 },
  { id: "1920x1080", name: "Wide · 1920×1080", w: 1920, h: 1080 },
  { id: "1080x1920", name: "Story · 1080×1920", w: 1080, h: 1920 },
];

/** Panel rectangles for a layout, in normalised 0..1 cover space. */
export function layoutRects(layoutId, w, h) {
  const g = 10; // gutter, px at export scale (scaled below by caller via w/1080)
  const s = w / 1080;
  const gap = g * s;
  const cell = (x, y, cw, ch, rot = 0) => ({ x, y, w: cw, h: ch, rot });
  switch (layoutId) {
    case "nine": {
      const cw = (w - gap * 4) / 3;
      const ch = (h - gap * 4) / 3;
      const at = (c, r) => cell(gap + c * (cw + gap), gap + r * (ch + gap), cw, ch);
      // Centre cell (1,1) is the title block, so it holds no photo.
      return [at(0, 0), at(1, 0), at(2, 0), at(0, 1), at(2, 1), at(0, 2), at(1, 2), at(2, 2)];
    }
    case "hero-three": {
      const heroW = w * 0.62 - gap;
      const sideX = heroW + gap * 2;
      const sideW = w - sideX - gap;
      const sh = (h - gap * 4) / 3;
      return [
        cell(gap, gap, heroW, h - gap * 2),
        cell(sideX, gap, sideW, sh),
        cell(sideX, gap * 2 + sh, sideW, sh),
        cell(sideX, gap * 3 + sh * 2, sideW, sh),
      ];
    }
    case "four": {
      const cw = (w - gap * 3) / 2;
      const ch = (h - gap * 3) / 2;
      return [
        cell(gap, gap, cw, ch), cell(gap * 2 + cw, gap, cw, ch),
        cell(gap, gap * 2 + ch, cw, ch), cell(gap * 2 + cw, gap * 2 + ch, cw, ch),
      ];
    }
    case "full":
      return [cell(0, 0, w, h)];
    case "tilted": {
      const pw = w * 0.52;
      const ph = h * 0.58;
      return [
        cell(w * 0.04, h * 0.06, pw, ph, -6),
        cell(w * 0.44, h * 0.10, pw, ph, 5),
        cell(w * 0.24, h * 0.38, pw, ph, -2),
      ];
    }
    case "diptych":
    default: {
      const cw = (w - gap * 3) / 2;
      return [cell(gap, gap, cw, h - gap * 2), cell(gap * 2 + cw, gap, cw, h - gap * 2)];
    }
  }
}

/** Where the title block lives for a layout (normalised rect + alignment). */
function titleZone(layoutId, w, h) {
  if (layoutId === "nine") {
    const s = w / 1080;
    const cw = (w - 10 * s * 4) / 3;
    const ch = (h - 10 * s * 4) / 3;
    return { x: 10 * s + cw + 10 * s, y: 10 * s + ch + 10 * s, w: cw, h: ch, align: "center" };
  }
  if (layoutId === "tilted") return { x: 0, y: 0, w, h: h * 0.07, align: "center" };
  if (layoutId === "full") return { x: w * 0.05, y: h * 0.68, w: w * 0.9, h: h * 0.28, align: "left" };
  return { x: 0, y: h * 0.82, w, h: h * 0.17, align: "center" };
}

let grainCanvas = null;
function grainPattern(ctx) {
  if (!grainCanvas) {
    grainCanvas = document.createElement("canvas");
    grainCanvas.width = 140;
    grainCanvas.height = 140;
    const g = grainCanvas.getContext("2d");
    const img = g.createImageData(140, 140);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 118 + Math.floor(Math.random() * 40);
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  return ctx.createPattern(grainCanvas, "repeat");
}

function drawPhotoInto(ctx, img, rect, slot) {
  const zoom = slot.zoom || 1;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const pw = iw * base;
  const ph = ih * base;
  const ox = rect.x + (rect.w - pw) / 2 + (slot.x || 0) * rect.w;
  const oy = rect.y + (rect.h - ph) / 2 + (slot.y || 0) * rect.h;
  ctx.drawImage(img, ox, oy, pw, ph);
}

function gradeWash(ctx, gradeId, w, h) {
  if (gradeId === "mono") return; // mono is handled per-photo with a filter
  let grad;
  if (gradeId === "sunset") {
    grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "rgba(255,122,26,0.28)");
    grad.addColorStop(0.55, "rgba(255,46,136,0.16)");
    grad.addColorStop(1, "rgba(123,47,255,0.30)");
  } else if (gradeId === "neon") {
    grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "rgba(255,46,136,0.34)");
    grad.addColorStop(0.5, "rgba(20,10,40,0.05)");
    grad.addColorStop(1, "rgba(46,230,200,0.30)");
  } else if (gradeId === "gold") {
    grad = ctx.createLinearGradient(0, h, w, 0);
    grad.addColorStop(0, "rgba(255,201,60,0.30)");
    grad.addColorStop(1, "rgba(255,122,26,0.18)");
  } else if (gradeId === "ocean") {
    grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(46,230,200,0.26)");
    grad.addColorStop(1, "rgba(37,99,235,0.34)");
  } else {
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // A warm foot-glow so the title always sits on colour, not on photo noise.
  const foot = ctx.createLinearGradient(0, h * 0.55, 0, h);
  foot.addColorStop(0, "rgba(20,5,35,0)");
  foot.addColorStop(1, "rgba(20,5,35,0.42)");
  ctx.fillStyle = foot;
  ctx.fillRect(0, 0, w, h);
}

function halftone(ctx, w, h, s) {
  const step = Math.max(7, 7 * s);
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#000";
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, step * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family, weight = "") {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawStar(ctx, cx, cy, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * rr;
    const py = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? "#ffc93c" : "rgba(255,255,255,0.25)";
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  ctx.strokeStyle = "#111";
  ctx.stroke();
}

/**
 * Draws the full cover.
 * @param {HTMLCanvasElement} canvas
 * @param {object} state { layout, grade, title, subtitle, badge, heat, slots }
 * @param {Array<HTMLImageElement|null>} images photos by index
 */
export function drawCover(canvas, state, images) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const s = w / 1080; // export scale: type and gutters scale with width

  // White gutters + black ink frame, the GTA comic-book base.
  ctx.fillStyle = "#f8f2ea";
  ctx.fillRect(0, 0, w, h);

  const rects = layoutRects(state.layout, w, h);
  const mono = state.grade === "mono";

  rects.forEach((panel, i) => {
    const slot = state.slots[i] || { photo: i, zoom: 1, x: 0, y: 0 };
    const img = images[slot.photo] ?? null;
    // drawRect is the panel's own coordinate frame (untilted after rotation).
    let drawRect = panel;
    ctx.save();
    if (panel.rot) {
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate((panel.rot * Math.PI) / 180);
      ctx.translate(-panel.w / 2, -panel.h / 2);
      drawRect = { x: 0, y: 0, w: panel.w, h: panel.h, rot: 0 };
    }
    ctx.beginPath();
    ctx.rect(drawRect.x, drawRect.y, drawRect.w, drawRect.h);
    ctx.clip();
    ctx.fillStyle = "#241533";
    ctx.fillRect(drawRect.x, drawRect.y, drawRect.w, drawRect.h);
    if (img) {
      if (mono) ctx.filter = "grayscale(1) contrast(1.25) brightness(1.05)";
      drawPhotoInto(ctx, img, drawRect, slot);
      ctx.filter = "none";
    }
    ctx.restore();
    // Ink border around every panel (rotated back into place for tilted).
    ctx.save();
    if (rects[i].rot) {
      ctx.translate(rects[i].x + rects[i].w / 2, rects[i].y + rects[i].h / 2);
      ctx.rotate((rects[i].rot * Math.PI) / 180);
      ctx.translate(-rects[i].w / 2, -rects[i].h / 2);
    } else {
      ctx.translate(rects[i].x, rects[i].y);
    }
    ctx.lineWidth = Math.max(2, 4 * s);
    ctx.strokeStyle = "#111";
    ctx.strokeRect(0, 0, rects[i].w, rects[i].h);
    ctx.restore();
  });

  gradeWash(ctx, state.grade, w, h);
  if (mono) halftone(ctx, w, h, s);

  // Film grain + vignette over everything.
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = grainPattern(ctx);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Title block.
  const zone = titleZone(state.layout, w, h);
  const title = (state.title || "").trim().toUpperCase();
  if (title) {
    ctx.save();
    if (state.layout === "nine") {
      ctx.fillStyle = "#160a26";
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.lineWidth = Math.max(2, 4 * s);
      ctx.strokeStyle = "#111";
      ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    }
    const cx = zone.x + zone.w / 2;
    const cy = zone.y + zone.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(-0.035);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const maxW = zone.w * (state.layout === "nine" ? 0.86 : 0.92);
    const size = fitFont(ctx, title, maxW, Math.min(zone.h * 0.62, 150 * s), '"Anton", sans-serif');
    ctx.lineWidth = Math.max(3, size * 0.16);
    ctx.strokeStyle = "#111";
    ctx.lineJoin = "round";
    ctx.strokeText(title, 0, -size * 0.08);
    ctx.fillStyle = "#fff";
    ctx.fillText(title, 0, -size * 0.08);
    const sub = (state.subtitle || "").trim();
    if (sub) {
      const subSize = fitFont(ctx, sub, maxW, Math.min(52 * s, zone.h * 0.22), '"Pacifico", cursive');
      ctx.font = `${subSize}px "Pacifico", cursive`;
      ctx.lineWidth = Math.max(2, subSize * 0.12);
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.strokeText(sub, 0, size * 0.52);
      ctx.fillStyle = "#ffc93c";
      ctx.fillText(sub, 0, size * 0.52);
    }
    ctx.restore();
  }

  // Sticker badge ribbon, top-left.
  const badge = (state.badge || "").trim().toUpperCase();
  if (badge) {
    ctx.save();
    ctx.translate(w * 0.02, h * 0.045);
    ctx.rotate(-0.06);
    ctx.font = `${Math.round(30 * s)}px "Anton", sans-serif`;
    const bw = Math.min(w * 0.4, ctx.measureText(badge).width + 90 * s);
    const bh = 54 * s;
    ctx.fillStyle = "#ff2e88";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = Math.max(2, 3 * s);
    ctx.beginPath();
    ctx.roundRect(0, 0, bw, bh, 8 * s);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = `${Math.round(30 * s)}px "Anton", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badge, bw / 2, bh / 2 + 2 * s);
    ctx.restore();
  }

  // Star heat meter, top-right. Stars run left to right: the filled ones
  // (heat of 5) sit on the left, the empty ones on the right.
  const heat = Math.max(0, Math.min(5, state.heat || 0));
  const starR = 17 * s;
  const rightX = w - w * 0.02 - starR;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, rightX - (4 - i) * starR * 2.3, h * 0.045 + starR * 0.4, starR, i < heat);
  }
}

/** Default state: neon street in the hero slot, the other samples filling in. */
export function defaultState() {
  return {
    layout: "nine",
    grade: "sunset",
    title: "VICE COAST",
    subtitle: "Neon nights, palm dreams",
    badge: "VICE COAST",
    heat: 4,
    size: "1920x1080",
    selected: 0,
    slots: [
      { photo: 0, zoom: 1, x: 0, y: 0 },
      { photo: 1, zoom: 1, x: 0, y: 0 },
      { photo: 2, zoom: 1, x: 0, y: 0 },
      { photo: 3, zoom: 1, x: 0, y: 0 },
      { photo: 0, zoom: 1, x: 0, y: 0 },
      { photo: 1, zoom: 1, x: 0, y: 0 },
      { photo: 2, zoom: 1, x: 0, y: 0 },
      { photo: 3, zoom: 1, x: 0, y: 0 },
    ],
  };
}

export const SAMPLE_PHOTOS = [
  "samples/neon-street.webp",
  "samples/rooftop-dusk.webp",
  "samples/boulevard.jpg",
  "samples/pier.jpg",
];
