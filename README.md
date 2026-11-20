[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/eason60547-prog/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/eason60547-prog/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Coast Cover Studio

A small web studio that turns a handful of holiday snaps into a bold,
multi-panel poster cover — the kind of sun-soaked, neon-lit collage you would
expect on a game box. It runs entirely in your browser. There is no account,
no upload queue and no server doing the work behind your back: the page draws
every pixel on a canvas on your own machine, and the finished poster downloads
as a PNG you can post anywhere.

![Vice Coast cover](screenshots/01-cover.jpg)

## Opening it

There are two ways to get the studio on screen, and both work without an
internet connection once the files are on your disk.

**Just open the file.** Double-click `app/index.html`, or drag it into a
desktop browser window. The editor loads with four ready-made sample photos
already in place, so you can start playing before you have chosen any of your
own pictures.

**Or run the little dev server.** From the repository root:

```sh
node serve.ts --port 8081
```

Then visit <http://localhost:8081>. The server does nothing but hand out the
files under `app/` with the right content types; it keeps no state and stores
nothing. Port 8080 is the default if you leave `--port` out.

You need a reasonably modern desktop browser. The studio leans on the 2D
canvas API, the `FontFace` loading API and ES modules, all of which have been
standard for years. A phone browser will open the page, but the controls are
laid out for a wide screen, and cropping panels with sliders is much pleasanter
with a mouse.

## Your first cover in about a minute

1. **Open the studio.** The preview on the right already shows a finished
   cover built from the four sample photos.
2. **Try a one-click look.** Under "One-click looks", tap **Sunset Hero**,
   **Neon Nights** or **Mono Ink**. Each one swaps the layout, the colour
   grade and the wording in a single move, so you can feel the range of the
   tool before touching anything else.
3. **Bring your own photos (optional).** Drag up to four pictures onto the
   preview, or use the file picker under "Photos". They replace the samples
   for this session only — nothing is uploaded, and closing the tab forgets
   them.
4. **Pick a layout.** Seven are on offer; the new **Spotlight** layout puts
   one big photo full-bleed with the title sitting across its lower third.
   See the layout guide below.
5. **Pick a colour grade.** Five moods, from hot sunset pinks to a stark
   black-and-white ink treatment.
6. **Write your words.** Title, subtitle and badge text are all editable, and
   the heat meter runs from zero to five stars.
7. **Fix the crops.** Click any panel on the preview to select it, then nudge
   its pan sliders and zoom until the framing feels right.
8. **Choose a post size and export.** Hit **Export PNG**. The file downloads
   as `vice-coast-<size>.png` at exactly the pixel size you chose.

If you get lost at any point, the **Shuffle** button is a good reset: one tap
deals you a fresh combination of layout, grade and photo placement, and you can
keep tapping until something catches your eye.

## Every control, and what it does

### Photos

- **File picker** — choose up to four of your own images. If you pick more
  than four, only the first four are used. Files that fail to load as images
  are skipped quietly; the cover keeps drawing with whatever did load.
- **Drag and drop** — drop image files directly onto the preview area. The
  preview gets a visible outline while you hover, so you know the drop will
  land. Dropping new photos replaces the current set and resets the panels
  so every slot gets a photo.
- **Sample photos** — four pictures ship with the studio (a neon street, a
  rooftop at dusk, a sunny boulevard and a pier) so the editor is never empty
  on first open. They are images made with a generative model, free to use,
  with no real people in them.

### One-click looks

Three finished recipes. Each one sets the layout, the grade, the title, the
subtitle, the badge and the heat all at once, and refills the panels with the
current photos. They are starting points, not locked templates: change any
single control afterwards and the look stops claiming to be a preset, so your
edits are never silently overwritten.

- **Neon Nights** — hero-plus-three layout, magenta/teal grade, night wording.
- **Sunset Hero** — nine-panel grid, warm sunset grade, the classic title.
- **Mono Ink** — tilted snapshots, black-and-white grade, four stars of heat.

### Layout — seven ways to arrange the photos

| Layout | Panels | What it looks like |
| --- | --- | --- |
| Nine-panel grid | 8 photos + title | A 3 × 3 grid; the middle cell is the title block, so the words sit at the heart of the collage. |
| Hero + three | 4 photos | One large hero photo on the left, three smaller panels stacked on the right. |
| Four-panel | 4 photos | A plain 2 × 2 grid — the calmest arrangement. |
| Full-bleed | 1 photo | A single photo edge to edge, title band low on the image. |
| Tilted snapshots | 3 photos | Three overlapping snapshots, each rotated a few degrees, with white snapshot borders. |
| Diptych | 2 photos | Two tall panels side by side. |
| Spotlight | 1 photo | One photo fills the whole canvas and the title block overlaps its lower third, so the picture stays the star and the words sit on top of it. |

Switching layouts keeps your title, grade and words, and reshapes the panels
to fit the new arrangement. Panels that no longer exist are dropped; new ones
are filled from your photos in order.

### Colour grade — five moods

| Grade | Mood |
| --- | --- |
| Vice Sunset | Warm pink-to-orange dusk wash. |
| Neon Nights | Magenta from the top, cyan from the bottom. |
| Palm Gold | Golden-hour warmth, amber glow. |
| Mono Ink | Black and white, with a heavy halftone dot texture over the whole cover. |
| Ocean Drive | Cool turquoise fading into deep blue. |

A grade is a translucent wash laid over the finished panels plus a glow colour
that tints the title block's sun and the subtitle. It never touches your
source photos — pick another grade and the photos underneath are unchanged.

### Words

- **Title** — the big line, set in Anton capitals (up to 24 characters). It
  is drawn with a white-to-gold gradient fill and a dark outline, and it
  shrinks automatically if a long title would overflow its block.
- **Subtitle** — a script line in Pacifico, glowing in the grade's colour
  (up to 48 characters). Leave it blank and the line simply disappears; the
  rest of the title block re-centres itself.
- **Badge** — the short pill label above the title (up to 16 characters),
  filled with a pink-to-orange gradient.
- **Heat** — a slider from 0 to 5 that fills that many of the five stars
  under the title. It is a rating, a joke, a hype meter — whatever you want
  it to mean.

Typing in any word field updates the preview live, letter by letter. Each
typing run counts as one undo step, not one step per keystroke.

### Panel — framing one photo at a time

- **Selected panel** — a dropdown listing Panel 1, Panel 2, and so on for
  however many panels the current layout has. Clicking a panel directly on
  the preview selects it too, and the status line confirms which one you
  picked.
- **Photo in this panel** — assign any loaded photo to the selected panel.
  The same photo can appear in several panels with different crops.
- **Pan left / right and Pan up / down** — slide the photo inside its frame.
  Both run from 0 to 1, with 0.5 dead centre.
- **Zoom** — from 1× (the photo just covers its frame) up to 2.5×. Zooming in
  gives the pan sliders more room to roam; zooming back out re-centres the
  crop.
- **Arrow keys** — with the focus outside the text fields, ← and ↑ move to
  the previous panel and → and ↓ move to the next one, wrapping around at the
  ends. The panel dropdown follows along, so you can walk the whole cover
  without touching the mouse.

### Export size — pick where it will be posted

- **1080 × 1080** — Square, for a standard feed post.
- **1080 × 1350** — Portrait, for a taller feed post.
- **1920 × 1080** — Landscape, for a desktop wallpaper or a social header.
- **1080 × 1920** — Story, for a full-screen phone story.

The preview canvas resizes to the chosen dimensions, and the export renders
fresh at full resolution rather than upscaling the on-screen preview, so the
downloaded PNG is crisp at exactly the size you picked.

### Watermark

A single checkbox. Off by default. When on, the export gets a small
"MADE WITH VICE COAST" line in the bottom-right corner, drawn last so it
stays readable over any photo. The preview shows it too, so there are no
surprises at export time.

### Shuffle

One button, one fresh cover. Shuffle rolls a new layout, a new colour grade
and a new random photo for every panel, all in a single tap — and it records
the change in the undo history, so a shuffle you dislike is one **Undo**
away. It is the fastest way to browse combinations, and a good cure for a
blank canvas: keep tapping until a direction appears, then refine it by hand.

### Undo and redo

- **Undo** button, or **Ctrl+Z** (macOS: **Cmd+Z**).
- **Redo** button, or **Ctrl+Shift+Z** / **Ctrl+Y** (macOS: **Cmd+Shift+Z**).
- Up to 60 steps are kept. Layout changes, grade changes, photo swaps,
  shuffles, size changes and watermark toggles each record one step; a drag
  of a slider or a run of typing records one step for the whole gesture.
- The shortcuts are ignored while your cursor is inside a text field, so
  Ctrl+Z still means "undo typing" where you are typing.

## Keyboard shortcuts

| Keys | Does |
| --- | --- |
| ← / ↑ | Select the previous panel |
| → / ↓ | Select the next panel |
| Ctrl+Z / Cmd+Z | Undo |
| Ctrl+Shift+Z / Cmd+Shift+Z, or Ctrl+Y | Redo |
| S | Shuffle a fresh cover |

## How the cover engine works

The drawing lives in `app/src/cover.js`, and the editor wiring lives in
`app/src/main.js`. The split is deliberate: the engine knows nothing about
buttons or the page, so the same drawing code paints the editor preview, the
PNG export and the screenshot scenes.

**Geometry first.** Every layout is described as rectangles measured in
fractions of the canvas, not in pixels. A helper works out the panel
rectangles for the chosen layout at whatever size the canvas currently is —
thirds for the nine-panel grid, a 66/34 split for hero-plus-three, halves for
the four-panel and diptych, rotated rectangles for the tilted snapshots, and a
single full-canvas rectangle for Full-bleed and Spotlight. Because the
geometry is fractional, a layout drawn at 1080 × 1080 and the same layout
drawn at 1920 × 1080 are the same composition, just at different sizes.

**Title placement.** Layouts fall into two families. The nine-panel grid
keeps a real cell in the middle of the grid for the title. Every other layout
gets a title band laid over the photos: low and wide for most layouts, a
narrow strip at the top for the tilted snapshots, and — for Spotlight — a
broad block covering the lower third of the photo, overlapping it rather than
sitting beside it. The title block is measured as a stack (badge pill, gap,
title, gap, subtitle, gap, stars) and the whole stack shrinks as one piece if
it would not fit, so long titles never spill onto the photos below.

**Lettering.** The title is Anton, a heavy condensed sans, filled with a
vertical gradient (white at the top, gold in the middle, the grade's glow
colour at the bottom) and stroked with a dark outline so it stays readable
where it crosses bright photos or the halftone sun. The subtitle is Pacifico,
a flowing script, filled in the grade's glow colour with a soft shadow blur
that makes it feel lit. The badge is a rounded pill with a pink-to-orange
gradient. If either webfont fails to load, the canvas falls back to generic
sans-serif and cursive faces and the cover still draws.

**The poster sun.** Behind the lettering, the title block carries a large
halftone sun: a radial glow clipped to a circle, overlaid with a grid of dots
that grow steadily larger toward the bottom of the circle. It is what makes
the title cell read as a poster panel instead of an empty dark box, and it
picks up the current grade's glow colour — pink for sunset, cyan-magenta for
neon, white for mono.

**Cover-fit photos.** Each photo is drawn to cover its panel: it is scaled
until it fills the frame on both axes, then the pan values slide it within
the frame and the zoom scales it further. The pan math clamps the slide to
whatever overhang the zoom creates, so you can never pan a photo clean out
of its frame and leave a gap.

**Grades and texture.** Once the panels and the title are painted, the engine
lays a top-to-bottom translucent wash over the whole canvas in the grade's
two colours. Mono Ink then gets a halftone dot screen across the full cover,
with dots that alternate subtly in size so the pattern reads at small sizes
without burying faces. Finally, a seeded film grain (the same pseudo-random
pattern on every render, so exports are reproducible) and a soft vignette
darken the corners and pull the eye toward the middle. An outer frame and an
optional watermark are drawn last.

**Rendering order, in short:** dark backdrop gradient → photo panels with
ink borders (grayscale filter for Mono Ink) → grade wash → mono halftone →
title block → grain → vignette → watermark → outer frame.

**State and history.** The editor keeps one plain state object — layout,
grade, size, words, heat, watermark and one panel record per slot — and the
cover is a pure function of that state plus the loaded photos. Undo and redo
work by snapshotting the state as JSON before each change and restoring it,
which is why every control, including Shuffle, can be undone with the same
mechanism.

## Screenshot scenes

The app understands `?shot=` URLs so its own screenshots are reproducible
from the same code that ships. `app/src/shots.js` runs them:

- `?shot=cover&size=1920x1080&layout=nine&grade=sunset` — one cover alone,
  no editor chrome, at the size, layout and grade named in the query.
- `?shot=editor` — the full editor with the sample photos loaded.

The page sets `window.__shotReady` once the cover has been painted, which is
the signal screenshot scripts wait for. The four screenshots in
`screenshots/` were taken this way with Playwright's Chromium against the
local dev server; each one is a real render of the app, not a mock-up.

## Working offline, and your privacy

Everything the studio needs ships in the repository: the page, the styles,
the engine, the two fonts and the four sample photos. Open it with no network
and it works — the fonts are local files, not a webfont service, and there is
no analytics, no tracking pixel and no upload endpoint to call. Your photos
are loaded into the browser's memory and drawn on a canvas; they are never
sent anywhere, because there is nowhere to send them to.

## Frequently asked questions

**The cover is blank / the photos are missing.**
Reload the page and give it a second — the samples load asynchronously, and
the status line says "Sample photos loaded" when they arrive. If you opened
`index.html` straight from disk in a browser that blocks local file access,
run the dev server instead (`node serve.ts --port 8081`).

**The title looks like a plain sans-serif font.**
The Anton and Pacifico files live in `app/fonts/`. If they were deleted or
moved, the cover falls back to generic fonts and still draws — restore the
two `.ttf` files and reload. The editor waits for both fonts before its final
paint.

**I dropped photos but nothing changed.**
Only image files are accepted, and only the first four. A file that is not a
readable image is skipped. Check the status line: it reports how many photos
actually loaded.

**The export is the wrong size.**
The export uses the size selected in "Export size" at the moment you click
**Export PNG**, and renders fresh at that resolution. Change the size first,
watch the preview resize, then export.

**Undo does nothing.**
Undo steps are recorded when a control changes something. Clicking the same
layout or grade that is already active records nothing — there is nothing to
undo. Typing runs count as one step per run, and the history holds 60 steps.

**Arrow keys move the page instead of the panels.**
The panel shortcuts only fire when the focus is not inside a text field,
dropdown or slider. Click the preview canvas once, then use the arrow keys.

**Shuffle gave me a layout I hate.**
That is what Undo is for — one Ctrl+Z (or the Undo button) takes you back
to the cover you had before the shuffle. Shuffle again from there.

**Can I use the exported PNG commercially?**
The cover you make is yours: your photos, your words. The lettering uses
Anton and Pacifico under the SIL Open Font License, and the sample photos
are model-generated images with no real people in them. The studio contains
no game artwork, logos or trademarks — it is an original pastiche, not a
copy of any official art.

**Does it work on a phone?**
The page opens, but the two-column editor is designed for a wide screen.
For serious editing, use a desktop browser.

## Files in this repository

- `app/index.html` — the page and every control on it.
- `app/style.css` — the editor styling.
- `app/src/main.js` — the editor: sample loading, controls, presets, Shuffle,
  keyboard shortcuts, undo/redo history, PNG export, click-to-select panels.
- `app/src/cover.js` — the cover engine: seven layouts, five grades,
  lettering, the halftone sun, grain, vignette and the full render order.
- `app/src/shots.js` — the fixed `?shot=` scenes used for screenshots.
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License, with
  their OFL licence texts beside them.
- `app/samples/` — four sample photos made with an image model, free to use.
- `screenshots/` — four screenshots taken from the app itself.
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to `/output`
  and writes `/output/dossier.json` with the vendored make.fun library.
- `serve.ts` — a tiny static server for local testing.

Run the hand-in yourself with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Run it twice and the two `out/` trees are byte-identical.

## Fonts, photos and originality

Everything here is original work. There is no Rockstar Games logo, wordmark,
official artwork, character or font anywhere in the app. The lettering is
Anton and Pacifico, both shipped under the SIL Open Font License with their
licence texts in `app/fonts/`, and every photo is either one you load yourself
or a sample made with an image model.

## License

MIT — see [LICENSE](LICENSE).

<sub>Entered on [make.fun](https://make.fun/?ref=mz84a1xs&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
