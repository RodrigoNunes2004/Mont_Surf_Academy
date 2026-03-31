/**
 * Generates PWA icon PNGs from the SVG source.
 *
 * Usage:  node scripts/generate-icons.mjs
 * Requires: sharp  (npm i -D sharp)
 *
 * If sharp is unavailable the script copies the SVG as a
 * placeholder and prints instructions.
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const iconsDir = resolve(root, "public/icons");
const svgPath = resolve(iconsDir, "icon.svg");

const sizes = [192, 512];

async function main() {
  if (!existsSync(svgPath)) {
    console.error("SVG source not found at", svgPath);
    process.exit(1);
  }

  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.log("sharp not installed — creating SVG copies as placeholders.");
    console.log("Run `npm i -D sharp` then re-run this script for real PNGs.\n");
    for (const s of sizes) {
      copyFileSync(svgPath, resolve(iconsDir, `icon-${s}.png`));
      copyFileSync(svgPath, resolve(iconsDir, `icon-maskable-${s}.png`));
    }
    console.log("Placeholder icons created.");
    return;
  }

  const svg = readFileSync(svgPath);

  for (const s of sizes) {
    await sharp(svg).resize(s, s).png().toFile(resolve(iconsDir, `icon-${s}.png`));
    console.log(`✓ icon-${s}.png`);

    // Maskable: add 20% safe-zone padding
    const padding = Math.round(s * 0.1);
    const inner = s - padding * 2;
    await sharp(svg)
      .resize(inner, inner)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 15, g: 23, b: 42, alpha: 1 }, // #0f172a
      })
      .png()
      .toFile(resolve(iconsDir, `icon-maskable-${s}.png`));
    console.log(`✓ icon-maskable-${s}.png`);
  }

  // Apple touch icon (180x180)
  await sharp(svg).resize(180, 180).png().toFile(resolve(iconsDir, "apple-touch-icon.png"));
  console.log("✓ apple-touch-icon.png");

  console.log("\nAll icons generated!");
}

main().catch(console.error);
