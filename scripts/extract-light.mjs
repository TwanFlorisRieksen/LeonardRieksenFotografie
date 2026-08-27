/*
 * EXTRACT-LIGHT — measure the LIGHT of every authorised photograph, once, at author time.
 *
 * WHY THIS EXISTS (D-63, "THE BUILT GALLERY")
 * -------------------------------------------
 * The portfolio's room is lit by the work hanging in it. That is not a metaphor and not a hand-picked
 * palette: the colour of the light falling on the wall beside a photograph is MEASURED FROM THAT
 * PHOTOGRAPH'S OWN FILE. A blue-hour facade lights the wall blue; an avondrood bridge lights it gold;
 * the green laser piece lights it green. The room therefore changes as the visitor moves along the
 * wall, because the WORK changes — never because a designer chose a gradient.
 *
 * WHY IT IS NOT AN AVERAGE
 * ------------------------
 * The mean colour of a photograph is mud — every image averages to a similar desaturated grey-brown,
 * which is exactly the failure mode that would make every chapter look identical. What lights a room
 * is its LIGHT: the bright, saturated part. Each pixel is therefore weighted by `s · v²`, which ranks
 * "bright and chromatic" far above "large and dull", and only the top eighth is averaged.
 *
 * Verified against the real archive: blue-hour work lands at hue 208-219, warm evening/interior work at
 * hue 34-47, the green light-art piece at 122, Soestdijk at 262 — and the one black-and-white work
 * measures saturation 0.00, so the room correctly stays neutral for it. That last case is the proof
 * that this reads the photograph rather than imposing on it.
 *
 * WHY AT AUTHOR TIME AND NOT IN THE BUILD
 * ---------------------------------------
 * The output is a small, human-readable, reviewable JSON committed alongside the photographs. That
 * makes the room's colour auditable (a wrong-looking wall can be traced to a number), keeps `astro
 * build` free of image analysis, and means the values are identical on every machine and every deploy.
 * Re-run after adding or replacing photography:  node scripts/extract-light.mjs
 *
 * `sharp` is already present — astro:assets depends on it — so this adds NO new dependency.
 */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORTFOLIO = resolve(HERE, '../src/content/portfolio');
const PROJECTS = resolve(HERE, '../src/content/projects');
const OUT = join(PORTFOLIO, 'light.json');

/** Sample size. 64px is ample: we want the image's light, not its detail. */
const SAMPLE = 64;

function rgbToHsv(r, g, b) {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	let h = 0;
	if (d !== 0) {
		if (max === r) h = ((g - b) / d) % 6;
		else if (max === g) h = (b - r) / d + 2;
		else h = (r - g) / d + 4;
		h *= 60;
		if (h < 0) h += 360;
	}
	return { h, s: max === 0 ? 0 : d / max, v: max };
}

/**
 * The light of one photograph.
 *
 * Returns the RGB the room should be lit with, plus the hue/saturation/value it was derived from so a
 * reviewer can see WHY the wall looks the way it does without opening an image editor.
 */
async function lightOf(file) {
	const { data, info } = await sharp(file)
		.resize(SAMPLE, SAMPLE, { fit: 'inside' })
		.removeAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	const px = [];
	for (let i = 0; i < data.length; i += info.channels) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		const { s, v } = rgbToHsv(r, g, b);
		// Bright AND chromatic ranks highest. v is squared so a dim saturated pixel cannot outrank a
		// genuinely lit one — a shadowed red brick must not out-vote a blue sky.
		px.push({ w: s * v * v, r, g, b });
	}
	px.sort((a, b) => b.w - a.w);

	const top = px.slice(0, Math.max(1, Math.floor(px.length / 8)));
	const r = Math.round(top.reduce((n, p) => n + p.r, 0) / top.length);
	const g = Math.round(top.reduce((n, p) => n + p.g, 0) / top.length);
	const b = Math.round(top.reduce((n, p) => n + p.b, 0) / top.length);
	const { h, s, v } = rgbToHsv(r, g, b);

	return {
		rgb: [r, g, b],
		hue: Math.round(h),
		sat: Number(s.toFixed(3)),
		val: Number(v.toFixed(3)),
	};
}

const works = JSON.parse(await readFile(join(PORTFOLIO, 'works.json'), 'utf8')).works;

const out = {};
for (const w of works) {
	const file = join(PORTFOLIO, w.image.replace(/^\.\//, ''));
	out[w.id] = await lightOf(file);
}

// Project covers light the Projecten chapter the same way loose works light theirs.
const { readdir } = await import('node:fs/promises');
for (const dir of await readdir(PROJECTS, { withFileTypes: true })) {
	if (!dir.isDirectory()) continue;
	try {
		out[`project:${dir.name}`] = await lightOf(join(PROJECTS, dir.name, 'cover.jpg'));
	} catch {
		/* a project without a cover.jpg simply gets no light of its own; the room keeps the chapter's. */
	}
}

await writeFile(OUT, `${JSON.stringify(out, null, '\t')}\n`, 'utf8');

const n = Object.keys(out).length;
console.log(`extract-light: measured ${n} photographs -> ${OUT.replace(resolve(HERE, '..'), '.')}`);
