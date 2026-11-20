// Fixed scenes for screenshots: ?shot=editor shows the editor with the
// bundled samples loaded; ?shot=cover hides the editor chrome and paints the
// current cover full-frame at the export size, so a screenshot is a
// deterministic capture of the app running. window.__shotReady is set once
// the cover has been painted twice.
//
// Optional query knobs: size=1080x1080|1080x1350|1920x1080|1080x1920,
// layout=nine|hero|four|full|tilted|diptych,
// grade=sunset|neon|gold|mono|ocean, title=..., subtitle=...

import { EXPORT_SIZES, drawCover } from './cover.js';

const VALID_LAYOUTS = ['nine', 'hero', 'four', 'full', 'tilted', 'diptych'];
const VALID_GRADES = ['sunset', 'neon', 'gold', 'mono', 'ocean'];

function applyParams(params, state) {
  const size = params.get('size');
  if (size && EXPORT_SIZES[size]) state.size = size;
  const layout = params.get('layout');
  if (layout && VALID_LAYOUTS.includes(layout)) state.layout = layout;
  const grade = params.get('grade');
  if (grade && VALID_GRADES.includes(grade)) state.grade = grade;
  const title = params.get('title');
  if (title !== null) state.title = title;
  const subtitle = params.get('subtitle');
  if (subtitle !== null) state.subtitle = subtitle;
  const badge = params.get('badge');
  if (badge !== null) state.badge = badge;
  const heat = params.get('heat');
  if (heat !== null && !Number.isNaN(Number(heat))) {
    state.heat = Math.max(0, Math.min(5, Math.round(Number(heat))));
  }
}

export async function runShot(params, hooks) {
  const shot = params.get('shot');
  applyParams(params, hooks.state);
  await hooks.loadSamples();

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    // Paint at the true export size, not the editor's capped preview size.
    const size = EXPORT_SIZES[hooks.state.size] || EXPORT_SIZES['1080x1080'];
    const canvas = document.getElementById('cover');
    canvas.width = size.w;
    canvas.height = size.h;
    // Fonts must be in before the title is drawn; wait for them explicitly.
    try { await document.fonts.ready; } catch { /* fallbacks are fine */ }
    drawCover(canvas, hooks.photos(), hooks.state);
    document.title = 'Vice Coast — cover';
  } else {
    hooks.redraw();
  }

  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}
