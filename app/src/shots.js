// Fixed scenes for screenshots: ?shot=cover hides the editor chrome and draws
// the current cover full-frame at an export size; ?shot=editor shows the
// editor with the samples loaded. window.__shotReady is set once painted, so
// a screenshot script can wait for it instead of guessing a delay.

import { EXPORT_SIZES, drawCover } from "./cover.js";

/** Wait two animation frames so the canvas paint has actually landed. */
function painted() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; resolve(); }));
  });
}

export async function runShot(shot, query, state, photos, hooks) {
  const canvas = document.getElementById("cover");
  if (shot === "cover") {
    document.body.classList.add("shot-cover");
    const size = EXPORT_SIZES.find((s) => s.id === query.get("size")) ??
      EXPORT_SIZES.find((s) => s.w === 1920) ?? EXPORT_SIZES[0];
    const layout = query.get("layout");
    if (layout) state.layout = layout;
    const grade = query.get("grade");
    if (grade) state.grade = grade;
    const title = query.get("title");
    if (title) state.title = title;
    const subtitle = query.get("subtitle");
    if (subtitle) state.subtitle = subtitle;
    canvas.width = size.w;
    canvas.height = size.h;
    // Draw straight onto the visible canvas at export resolution.
    drawCover(canvas, state, photos.map((p) => p.img));
    await painted();
    return;
  }
  // Editor scene: keep the normal preview size, just make sure it is drawn.
  // Query params may still restyle it (?layout= / ?grade= / ?size=) so one
  // URL can stage any variant of the editor for a screenshot.
  const layout = query.get("layout");
  if (layout) state.layout = layout;
  const grade = query.get("grade");
  if (grade) state.grade = grade;
  const size = EXPORT_SIZES.find((s) => s.id === query.get("size"));
  if (size) state.size = size.id;
  hooks.fitPreview();
  hooks.syncControls();
  hooks.redraw();
  await painted();
}
