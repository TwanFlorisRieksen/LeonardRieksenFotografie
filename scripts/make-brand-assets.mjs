/*
 * BRAND DERIVATIVES — regenerate every published logo/favicon file from the ONE authorised master.
 *
 * The master is `../assets/logoLRF.png` (project-level /assets, CLAUDE.md §2.5): a 1672×941 transparent
 * PNG whose ink occupies only the middle 998×396 of the canvas. Publishing that file directly is what
 * produced the clipped header (a 2.52:1 lockup forced through a 3.0:1 crop box) and 136 KB of mostly
 * empty pixels on every page. Nothing here redraws or restyles the mark: it is trimmed to its own ink,
 * resized, and — for the favicon — composed on the site's own chrome sapphire, which is the only way a
 * near-white transparent mark is visible in a browser tab.
 *
 * Run:  node scripts/make-brand-assets.mjs      (from output/)
 * Outputs are committed; this script exists so they are reproducible, never hand-edited.
 *
 * D-89 (2026-09-18, owner instruction): the owner supplied a revised full lockup, same 1672×941 canvas
 * as the previous master, with a larger-set FOTOGRAFIE line — `../assets/logoLRF-2026-09-18.png`. The
 * previous `logoLRF.png` / `logoLRF-beperkt.png` are left in place, superseded, not deleted (CLAUDE.md
 * §2.5/§9.3: originals are never destroyed). Its monogram sits at practically the same canvas position as
 * the old master's (measured left≈579 vs old 581, top≈251 vs old 246), which is why the favicon boxes
 * (still monogram-only — a 16/32/48px tab icon cannot carry a stacked lockup, D-79) barely moved.
 *
 * D-90 (2026-09-18, owner instruction, same day): D-89 first kept the header/footer at the bare monogram
 * (owner's choice when asked). The owner then looked at the live render and asked again, explicitly this
 * time, for the FULL lockup — name and all — in the header and footer. `Wordmark.astro` now renders
 * `lrf-logo.png`, trimmed from the new master's full ink box (monogram + rule + both name lines), not the
 * monogram-only `MARK_INK` crop below. The monogram-only crop stays because the favicon still needs it.
 * The header bar itself grew (`--header-height` in tokens.css, 4.75rem → 6.5rem) to hold the lockup at a
 * size where "FOTOGRAFIE" is actually legible, not decoratively present — see Wordmark.astro for the sizing
 * arithmetic and DECISIONS D-90 for why a fixed-bar-height full lockup (the pre-D-88 approach, ~62px tall,
 * ~6px caps) was rejected as too subtle rather than reused as-is.
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const SRC = '../assets/logoLRF-2026-09-18.png';
const MARK_SRC = '../assets/logoLRF-2026-09-18.png';
/** The new master's monogram+rule ink box, measured from its alpha channel (row-gap scan: monogram
    251–438, rule 474–482, then LEONARD RIEKSEN 535–583, FOTOGRAFIE 625–664 — cropped here at the rule).
    Only the favicon still uses this; the header/footer use FULL_INK below (D-90). */
const MARK_INK = { left: 579, top: 251, width: 514, height: 232 }; // ratio 2.2155
/** The full lockup's own ink box — monogram, rule, and both name lines, bounding-box tight (the gaps
    between the four text bands are transparent and included, same convention as MARK_INK). */
const FULL_INK = { left: 336, top: 251, width: 1000, height: 414 }; // ratio 2.4155
/** The monogram + its gold rule, with the same few px of breathing room the old crop had — the favicon's
    optical version at 32 px and up. */
const MARK = { left: 579, top: 244, width: 514, height: 247 };
/** At 16 px the gold rule is a sub-pixel smear and it steals height from the letterforms, so the smallest
    entry carries the monogram ALONE, drawn larger. Measured: this is the difference between three
    recognisable letters and a grey blur. */
const MARK_SMALL = { left: 665, top: 248, width: 361, height: 194 };
/** --p-sapphire-850, the lit top edge of the site's chrome. */
const BG = { r: 15, g: 25, b: 46, alpha: 1 };

/* 1 — the full lockup for the header/footer (D-90) and for schema.org/Organization, at its own native
   width — never upscaled past the 1000px ink the owner supplied. 700px covers the largest CSS render
   (~213px) at better than 3× for retina without upscaling. */
for (const [w, out] of [
	[700, 'public/brand/lrf-logo.png'],
	[1000, 'public/brand/lrf-logo-schema.png'],
]) {
	await sharp(MARK_SRC).extract(FULL_INK).resize({ width: w }).png({ compressionLevel: 9 }).toFile(out);
}

/* 2 — favicon artwork: the monogram on the chrome sapphire. Rounded for the .ico (it is drawn as-is in
   a tab), square for apple-touch-icon (iOS applies its own mask and a transparent corner shows black). */
async function tile(size, { round }) {
	const small = size <= 20;
	const inner = Math.round(size * (small ? 0.8 : round ? 0.76 : 0.72));
	const mark = await sharp(SRC).extract(small ? MARK_SMALL : MARK).resize({ width: inner }).png().toBuffer();
	const { height } = await sharp(mark).metadata();
	const layers = [{ input: mark, left: Math.round((size - inner) / 2), top: Math.round((size - height) / 2) }];
	if (round) {
		const r = Math.round(size * 0.18);
		layers.push({
			input: Buffer.from(
				`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`,
			),
			blend: 'dest-in',
		});
	}
	return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
		.composite(layers)
		.png({ compressionLevel: 9 })
		.toBuffer();
}

writeFileSync('public/apple-touch-icon.png', await tile(180, { round: false }));

/* 3 — a real multi-size .ico (16/32/48), each entry a PNG payload, which every browser since IE11 reads.
   The file that was here before was a bare PNG with an .ico extension, and it was the Astro starter's. */
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => tile(s, { round: true })));
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
const dir = Buffer.alloc(16 * sizes.length);
let offset = 6 + dir.length;
sizes.forEach((s, i) => {
	const o = i * 16;
	dir[o] = s;
	dir[o + 1] = s;
	dir.writeUInt16LE(1, o + 4);
	dir.writeUInt16LE(32, o + 6);
	dir.writeUInt32LE(pngs[i].length, o + 8);
	dir.writeUInt32LE(offset, o + 12);
	offset += pngs[i].length;
});
writeFileSync('public/favicon.ico', Buffer.concat([header, dir, ...pngs]));

console.log('[brand] lrf-logo.png, lrf-logo-schema.png, apple-touch-icon.png, favicon.ico regenerated');
