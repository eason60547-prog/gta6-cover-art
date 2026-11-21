// Fixed scenes for screenshots: the ?shot= URLs the app understands,
// so its own screenshots are reproducible from the same code that
// ships. `window.__shotReady` is set once the cover is painted, which
// is the signal screenshot scripts wait for before shooting.
//
// The four scenes, matching the four screenshots in screenshots/:
//
//   ?shot=cover   — the nine-grid Classic Nine cover alone, no editor
//                   chrome, 1920x1080 landscape (screenshot 01).
//   ?shot=editor  — the full editor with the sample photos loaded and
//                   the cover preview visible (screenshot 02).
//   ?shot=portrait — the same Classic Nine cover alone at 1080x1350
//                   portrait, the most-shared size (screenshot 03).
//   ?shot=square  — the cover alone at 1080x1080 square, in the
//                   Spotlight layout so one photo carries the whole
//                   frame (screenshot 04).
//
// Each scene also accepts overrides in the query, so a screenshot
// script can ask for a different layout, grade or size without a new
// scene: ?shot=cover&layout=four&grade=neon&size=1080x1080, for
// example. Unknown values fall back to the scene defaults, never to a
// crash — a bad query still paints a cover.

/**
 * The four scenes: layout, grade, size and (for the cover-only
 * scenes) whether the editor chrome is hidden. `sceneOffset` is the
 * Classic Nine rotation; 0 is the composed starting map.
 */
export const SHOT_SCENES = {
  cover: { layout: 'nine', grade: 'sunset', size: '1920x1080', coverOnly: true, sceneOffset: 0 },
  editor: { layout: 'nine', grade: 'sunset', size: '1920x1080', coverOnly: false, sceneOffset: 0 },
  portrait: { layout: 'nine', grade: 'sunset', size: '1080x1350', coverOnly: true, sceneOffset: 0 },
  square: { layout: 'spotlight', grade: 'sunset', size: '1080x1080', coverOnly: true, sceneOffset: 0 },
};

/** Resolves a shot name plus its query overrides into the concrete
 *  scene that will be painted. Screenshot scripts can call this to
 *  check what they are about to shoot before they open the page:
 *  the returned size is the exact pixel size of the cover canvas, and
 *  `coverOnly` says whether the editor chrome will be hidden. */
export function describeShot(shot, query) {
  const scene = SHOT_SCENES[shot] ?? SHOT_SCENES.cover;
  return {
    shot,
    layout: query.get('layout') ?? scene.layout,
    grade: query.get('grade') ?? scene.grade,
    size: query.get('size') ?? scene.size,
    sceneOffset: Number(query.get('swap') ?? scene.sceneOffset) || 0,
    coverOnly: scene.coverOnly,
  };
}

/**
 * Runs a shot scene.
 * `hooks` is what the editor owns: applyShot({ layout, grade, size,
 * sceneOffset }) applies the scene, loadSamples() loads the four
 * sample photos, redraw() paints the preview, whenReady() waits for
 * fonts and a painted frame.
 */
export async function runShot(shot, query, hooks) {
  // An unknown ?shot= value is not an error: it paints the cover
  // scene, so a typo in a screenshot script still produces a real
  // render instead of a blank page.
  const scene = SHOT_SCENES[shot] ?? SHOT_SCENES.cover;
  const layout = query.get('layout') ?? scene.layout;
  const grade = query.get('grade') ?? scene.grade;
  const size = query.get('size') ?? scene.size;
  const sceneOffset = Number(query.get('swap') ?? scene.sceneOffset) || 0;

  if (scene.coverOnly) {
    // Cover-only scenes hide the editor chrome through a body class
    // (see style.css): the top bar, the controls, the upload button
    // and the hint all disappear, and the cover fills the viewport.
    document.body.classList.add('shot-cover');
  } else {
    // The editor scene keeps the whole editor visible, with a class
    // the stylesheet uses to tighten the columns for a 1280-wide
    // capture, so the preview sits beside the controls without
    // scrolling.
    document.body.classList.add('shot-editor');
  }

  hooks.applyShot({ layout, grade, size, sceneOffset });
  await hooks.loadSamples();
  hooks.redraw();
  await hooks.whenReady();
  window.__shotReady = true;
}
