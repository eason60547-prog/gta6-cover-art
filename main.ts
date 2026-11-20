// Vice Coast Cover Studio — the entry's build step (Node 22, stdlib only).
//
// The app itself is plain static files in app/ (index.html, vanilla JS, CSS,
// vendored fonts and sample photos) that a desktop browser loads offline.
// This script is only the hand-in: it copies app/ and screenshots/ from
// beside this file into the output directory and writes dossier.json there,
// using the vendored make.fun library, so a judge can read the summary
// without running anything.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.)

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(outDir, { recursive: true });
cpSync(join(here, "app"), join(outDir, "app"), { recursive: true });
mkdirSync(join(outDir, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(outDir, "screenshots"), { recursive: true });
}

writeFileSync(
  join(outDir, "dossier.json"),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`Vice Coast Cover Studio copied to ${outDir}`);
const dossier = JSON.parse(readFileSync(join(outDir, "dossier.json"), "utf8"));
const shotNames = existsSync(join(outDir, "screenshots")) ? readdirSync(join(outDir, "screenshots")) : [];
console.log(`dossier: ${statSync(join(outDir, "dossier.json")).size} bytes, ${shotNames.length} screenshot(s): ${shotNames.join(", ")}`);
console.log(`app title: ${dossier.app?.title ?? dossier.title ?? "(see dossier.json)"}`);
