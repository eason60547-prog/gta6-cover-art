// Fixed scenes for screenshots: ?shot=cover shows the cover alone, ?shot=editor
// shows the editor with a photo loaded. Query knobs (all optional):
//   size=1080x1080|1080x1350|1920x1080|1080x1920  export size
//   layout=nine|hero-three|four|full|tilted|diptych
//   grade=sunset|neon|gold|mono|ocean
//   title=...&subtitle=...&badge=...&heat=0..5
// window.__shotReady is set once the scene is painted, so a screenshot runner
// can wait on it instead of guessing a delay.
export async function runShot(shot, query, api) {
  const patch = {};
  const size = query.get('size');
  if (size) patch.size = size;
  const layout = query.get('layout');
  if (layout) patch.layout = layout;
  const grade = query.get('grade');
  if (grade) patch.grade = grade;
  const title = query.get('title');
  if (title !== null) patch.title = title;
  const subtitle = query.get('subtitle');
  if (subtitle !== null) patch.subtitle = subtitle;
  const badge = query.get('badge');
  if (badge !== null) patch.badge = badge;
  const heat = query.get('heat');
  if (heat !== null) {
    const n = Number.parseInt(heat, 10);
    if (Number.isFinite(n)) patch.heat = Math.max(0, Math.min(5, n));
  }

  if (shot === 'cover') document.body.classList.add('shot-cover');
  api.applyShot(patch);
  await api.ensurePhotos();
  await api.redraw();
  // Fonts change the lettering, so wait until they are actually usable.
  try { await document.fonts.ready; } catch { /* fonts are best-effort */ }
  await api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
