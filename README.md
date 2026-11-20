# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/eason60547-prog/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/eason60547-prog/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Coast Cover Studio** — an offline browser web app that turns your photos and a caption into GTA 6-style multi-panel cover art, in the spirit of the iconic Vice City poster and loading screens. Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

## What it does

- **6 layouts**: nine-panel grid (centre cell is the title block), hero-and-three, four-panel, full-bleed, tilted snapshots, diptych split.
- **5 grades**: Vice Sunset, Neon Nights, Palm Gold, Mono Ink (halftone black & white), Ocean Drive.
- **Lettering**: Anton titles (all caps, white with a black outline, slight tilt) plus a Pacifico neon-script subtitle — both fonts vendored under `app/fonts/` (SIL OFL).
- **Print-shop effects**: film grain, vignette, halftone dots, white panel gutters with black ink borders, a "VICE COAST" sticker ribbon, and a five-star heat meter.
- **Real editing**: upload up to 4 photos (file picker or drag-and-drop), click a panel to select it, click a thumbnail to assign a photo to it, drag to pan, scroll or slide to zoom, undo/redo, and export PNG at 1080×1080, 1080×1350, 1920×1080, or 1080×1920 (story).
- **Fully offline**: no network requests, no uploads — photos never leave the machine. Everything (fonts, samples, code) is vendored under `app/`.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Or open `app/index.html` directly from any static server.

For deterministic screenshots the app supports `?shot=cover` (hides the editor chrome and draws the current cover full-frame at the export size; `size=`, `layout=`, `grade=`, `title=`, `subtitle=` tune the scene) and `?shot=editor` (the editor with a sample photo loaded).

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` into the output directory and writes `dossier.json` there.

## Notes

- The four bundled sample photos are free to use: two AI-generated images made for this entry (neon street, rooftop dusk) and two photos from the make.fun starter kit (boulevard, pier).
- Not affiliated with any game publisher. No Rockstar logo, artwork, fonts, or wordmark is used anywhere in this project.

---

<sub>Entered on [make.fun](https://make.fun/?ref=mz84a1xs&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
