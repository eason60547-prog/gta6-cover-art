# Vice Coast Cover Studio

[![make.fun](https://make.fun/badge.svg)](https://make.fun) [![Live on make.fun](https://make.fun/badge-live.svg)](https://make.fun) [![Built with make.fun](https://make.fun/badge-built.svg)](https://make.fun)

Turn your photos and a caption into GTA 6-style multi-panel cover art — right in the
browser, fully offline, no account, no upload, no network requests. Pick a layout, pick
a colour grade, tweak the title, and export a share-ready PNG.

Made with [make.fun](https://make.fun) — build your own entry with referral code `mz84a1xs`.

## How to use

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

Or just open `app/index.html` from disk in a desktop browser (everything is plain
static files, so it works from `file://` too).

1. **Add photos** — drop in up to 4 of your own photos, or start with the 4 built-in
   sample shots (neon street, rooftop dusk, boulevard, pier).
2. **Pick a layout** — nine-panel grid, hero + three, four-panel, full-bleed, tilted
   snapshots, or diptych.
3. **Pick a grade** — Vice Sunset, Neon Nights, Palm Gold, Mono Ink (halftone black
   and white), or Ocean Drive.
4. **Edit the words** — title, subtitle, badge text, and a 0–5 star heat meter.
5. **Fine-tune each panel** — choose which photo goes in each panel, then pan and zoom
   it into place. Undo and redo are one click away.
6. **Export** — PNG at 1080×1080, 1080×1350, 1920×1080, or 1080×1920 (story).

## Features

- 6 multi-panel layouts, including a nine-panel grid with a centre title block and a
  tilted-snapshots collage
- 5 colour grades with grain, vignette, halftone dots, and ink borders
- Anton display type for the title and a Pacifico neon script subtitle (both fonts
  vendored under `app/fonts/` under the SIL Open Font License)
- Per-panel photo assignment with pan and zoom, plus undo/redo history
- Live preview that always matches the exported PNG pixel for pixel
- Zero network requests: every asset is local, so it works on a plane
- Screenshot modes for the cover and the editor: `?shot=cover` and `?shot=editor`

## Layout

```
gta6-cover-art-01/
├── app/
│   ├── index.html          editor page
│   ├── style.css           editor + cover styling
│   ├── src/
│   │   ├── main.js         wiring: state, controls, undo/redo, export
│   │   ├── cover.js        the cover renderer (layouts, grades, effects)
│   │   └── shots.js        fixed ?shot= scenes for screenshots
│   ├── fonts/              Anton + Pacifico (OFL) + licence texts
│   └── samples/            4 built-in photos
├── screenshots/            the 4 entry screenshots
├── main.ts                 builds /output (app + screenshots + dossier.json)
├── serve.ts                tiny static server for local development
└── vendor/
    └── makefun-app.ts      vendored make.fun dossier helper
```

`main.ts` uses Node 22's standard library only. Running `node main.ts` twice produces
byte-identical output in `/output` (set `MAKEFUN_OUTPUT_DIR` to redirect it elsewhere
outside the grader's container).

## Notes

- All imagery is original or generated for this project. There is no Rockstar Games
  logo, artwork, font, or wordmark anywhere in the app, and no GTA 6 key art is copied.
- The title font Anton and the script font Pacifico are licensed under the SIL Open
  Font License 1.1; their licence texts live in `app/fonts/`.

---

Built on [make.fun](https://make.fun) · referral code `mz84a1xs`
