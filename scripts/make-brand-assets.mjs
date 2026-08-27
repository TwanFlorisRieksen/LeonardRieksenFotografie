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
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const SRC = '../assets/logoLRF.png';
/** The lockup's true ink box, measured from the master's alpha channel. */
const INK = { left: 338, top: 252, width: 998, height: 396 }; // ratio 2.5202
/** The monogram + its gold rule — the favicon's optical version at 32 px and up. */
const MARK = { left: 581, top: 246, width: 511, height: 246 };
/** At 16 px the gold rule is a sub-pixel smear and it steals height from the letterforms, so the smallest
    entry carries the monogram ALONE, drawn larger. Measured: this is the difference between three
    recognisable letters and a grey blur. */
const MARK_SMALL = { left: 665, top: 248, width: 363, height: 194 };
/** --p-sapphire-850, the lit top edge of the site's chrome. */
const BG = { r: 15, g: 25, b: 46, alpha: 1 };

/* 1 — the header lockup (transparent, trimmed) and a large logo for schema.org/Organization. */
for (const [w, out] of [
	[440, 'public/brand/lrf-lockup.png'],
	[600, 'public/brand/lrf-logo.png'],
]) {
	await sharp(SRC).extract(INK).resize({ width: w }).png({ compressionLevel: 9 }).toFile(out);
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

console.log('[brand] lrf-lockup.png, lrf-logo.png, apple-touch-icon.png, favicon.ico regenerated');
