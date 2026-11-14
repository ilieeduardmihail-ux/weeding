#!/usr/bin/env node
/**
 * Builds the served floral pictures from the artwork dropped in `design/florals/`.
 *
 * The masters live outside `public/` on purpose: they are large, often
 * half-transparent PSD/PNG exports, and shipping them would cost the visitor
 * megabytes. What ships is AVIF and WebP at the two widths a corner can use
 * (see FLORAL_IMAGES in lib/theme.ts), which is what `floralSrcSet` serves.
 *
 *   npm run florals:build                # design/florals -> public/florals
 *   npm run florals:build -- --in x --out y
 *
 * Artwork in `design/florals/` becomes a "corner" set (one bouquet, mirrored
 * into the other corners). Artwork in `design/florals/cadru/` becomes a "frame"
 * set: one picture that already contains both opposite corners and covers the
 * whole page. For every file the script prints the ready-to-paste
 * FLORAL_IMAGES entry.
 */
import { mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");

const args = process.argv.slice(2);
const value = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
};

const INPUT = path.resolve(ROOT, value("--in") ?? "design/florals");
const OUTPUT = path.resolve(ROOT, value("--out") ?? "public/florals");
const FRAME_DIR = "cadru";

/** Corner art is drawn at most 352 CSS px wide, frame art spans the viewport. */
const WIDTHS = {
  corner: [420, 760],
  frame: [1200, 2000],
};

const IMAGE_EXTENSIONS = new Set([".png", ".webp", ".jpg", ".jpeg", ".tif", ".tiff"]);

/** `Bujori crem (2).PNG` -> `bujori-crem-2` */
function slugify(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function widthsFor(native, kind) {
  const preset = WIDTHS[kind];
  const widths = preset.filter((width) => width < native);
  // Never upscale: if the artwork is smaller than the largest slot, ship it at
  // its own width and let the browser stretch it the little that is left.
  if (native <= preset[preset.length - 1]) widths.push(native);
  return [...new Set(widths)].sort((a, b) => a - b);
}

async function listArtwork(dir, kind) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const found = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === FRAME_DIR && kind === "corner" && dir === INPUT) {
        found.push(...(await listArtwork(full, "frame")));
      }
      continue;
    }
    const extension = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(extension)) continue;
    found.push({ file: full, kind, slug: slugify(entry.name), extension });
  }
  return found;
}

const artwork = await listArtwork(INPUT, "corner");

if (!artwork.length) {
  console.log(`Nicio poză în ${INPUT}.`);
  console.log("Pune fișierele acolo (PNG cu fundal transparent) și rulează din nou.");
  process.exit(0);
}

await mkdir(OUTPUT, { recursive: true });

const entries = [];
let totalBytes = 0;
let skipped = 0;

for (const { file, kind, slug, extension } of artwork) {
  if (!slug) {
    console.log(`- sar peste ${path.basename(file)}: numele nu dă un identificator`);
    skipped += 1;
    continue;
  }

  const source = await readFile(file);
  // Trim the transparent (or plain white) border so the bouquet sits flush in
  // the corner instead of floating on its own padding.
  const { data, info } = await sharp(source)
    .rotate()
    .trim({ threshold: 12 })
    .png()
    .toBuffer({ resolveWithObject: true });

  const widths = widthsFor(info.width, kind);
  const sizes = [];

  for (const width of widths) {
    const resized = sharp(data).resize({
      width,
      withoutEnlargement: true,
      kernel: "lanczos3",
    });
    const avif = path.join(OUTPUT, `${slug}-${width}.avif`);
    const webp = path.join(OUTPUT, `${slug}-${width}.webp`);
    await resized.clone().avif({ quality: 55, effort: 6 }).toFile(avif);
    await resized
      .clone()
      .webp({ quality: 80, effort: 6, alphaQuality: 100 })
      .toFile(webp);
    const bytes = (await stat(avif)).size + (await stat(webp)).size;
    totalBytes += bytes;
    sizes.push(`${width}px (${Math.round(bytes / 1024)} KB)`);
  }

  const lossy = extension === ".jpg" || extension === ".jpeg";
  entries.push({
    id: `photo-${slug}`,
    kind,
    native: `${info.width}×${info.height}`,
    widths,
    sizes,
    lossy,
  });
}

for (const entry of entries) {
  const note = entry.lossy
    ? "  ← JPG: fundalul rămâne vizibil, nu are transparență"
    : "";
  console.log(`\n${entry.id}  ${entry.kind}  ${entry.native}${note}`);
  console.log(`  ${entry.sizes.join("  ")}`);
  console.log(
    `  "${entry.id}": { src: "/florals/${entry.id.replace(/^photo-/, "")}", kind: "${entry.kind}", width: ${
      entry.native.split("×")[0]
    }, height: ${entry.native.split("×")[1]}, widths: [${entry.widths.join(", ")}] },`
  );
}

const files = (await readdir(OUTPUT)).filter((name) => IMAGE_EXTENSIONS.has(path.extname(name)));
console.log(
  `\n${entries.length} set(uri) scris(e) în public/florals — ${files.length} fișiere, ${Math.round(
    totalBytes / 1024
  )} KB în total.`
);
if (skipped) console.log(`${skipped} fișier(e) sărite.`);
