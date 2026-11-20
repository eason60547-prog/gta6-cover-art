# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/eason60547-prog/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/eason60547-prog/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Coast Cover Studio — a GTA 6-style cover art maker, offline, multi-panel, exports PNG. Drop in your own photos (up to 4, plus the bundled samples), pick one of 6 layouts and 5 colour grades, set the title and subtitle, then export a print-ready PNG in square, portrait, wide or story size. Everything runs in the browser; no upload, no account, no network requests.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or just open `app/index.html` in a browser (serving it locally is more reliable for the vendored fonts). Build the submission bundle with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

## How it works

- **6 layouts** — nine-panel grid (centre cell is the title block), hero + three, four-panel, full-bleed, tilted snapshots, diptych split.
- **5 grades** — Vice Sunset, Neon Nights, Palm Gold, Mono Ink (halftone B&W), Ocean Drive.
- **Lettering** — Anton for the title (all caps, white with a black ink outline, slight tilt) and Pacifico for the neon script subtitle. Both fonts are vendored under `app/fonts/` under the SIL Open Font License.
- **Effects** — film grain, vignette, halftone dots, white panel gutters with black ink borders, a "VICE COAST" sticker badge ribbon and a 5-star heat meter.
- **Controls** — upload up to 4 photos (file picker or drag-and-drop), click a panel to select it, click a thumbnail to assign a photo, drag to pan, scroll or use the slider to zoom, undo/redo, and export PNG at 1080×1080, 1080×1350, 1920×1080 or 1080×1920.
- **Screenshots** — `?shot=cover` hides the editor chrome and draws the cover full-frame at export size; `?shot=editor` shows the editor with a photo loaded.

The four sample photos in `app/samples/` are AI-generated images made for this entry (two neon-street / rooftop shots) plus the kit's two free photos (boulevard, pier). No game-studio logo, artwork, fonts or wordmark anywhere.

---

<sub>Entered on [make.fun](https://make.fun/?ref=mz84a1xs&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
