// Fixed scenes for screenshots: ?shot=editor shows the editor with the sample
// photos loaded; ?shot=cover shows one cover alone, at the size, layout and
// grade the query names. window.__shotReady is set once the cover is painted.

/**
 * Runs a shot scene.
 * `hooks` is what the editor owns: applyShot({ layout, grade, size }) applies
 * the query's scene, loadSamples() loads the four sample photos, redraw()
 * paints the preview, whenReady() waits for fonts and a painted frame.
 */
export async function runShot(shot, query, hooks) {
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    hooks.applyShot({
      layout: query.get('layout') ?? 'nine',
      grade: query.get('grade') ?? 'sunset',
      size: query.get('size') ?? '1920x1080',
    });
  }
  await hooks.loadSamples();
  hooks.redraw();
  await hooks.whenReady();
  window.__shotReady = true;
}
