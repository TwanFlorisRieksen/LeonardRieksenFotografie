/*
 * postbuild-verify-assets.mjs — closes PH-08 / SEC-10 / R-07 ("never publish original masters").
 *
 * PROBLEM (proven in P1.5, D-09): astro:assets copies the FULL-RESOLUTION source original into
 * dist/_astro for every imported image, byte-identical to the master, even though pages only reference
 * the generated AVIF/WebP/resized derivatives. There is no official Astro switch to suppress this.
 *
 * WHY THIS APPROACH (smallest robust solution — CLAUDE §11.5):
 *   Rather than guess originals by filename (fragile across Astro upgrades), we compute the set of asset
 *   URLs actually REFERENCED by the publishable output (HTML/XML/CSS/JS), delete every /_astro file that
 *   nothing references, then run an independent, definitive VERIFICATION: hash every remaining file in
 *   dist and fail the build if ANY is byte-identical to a known source master. The purge is resilient
 *   (no dependency on Astro's internal naming); the hash gate is the real guarantee and also protects
 *   against regressions (e.g. a future page that accidentally references image.src again — the P1.5 bug).
 *
 * A solution that relied on a human eyeballing dist/ would NOT satisfy PH-08. This fails CI/build loudly.
 *
 * Guarantees on success:
 *   - no source-master byte-identical file exists anywhere in dist/  (originals absent)
 *   - every referenced /_astro asset still exists               (derivatives intact, no broken refs)
 *   - the dev-only /styleguide is not present in production output
 */
import { createHash } from 'node:crypto';
import { readdirSync, statSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const DIST = 'dist';
const ASTRO_DIR = join(DIST, '_astro');
const SOURCE_DIRS = ['src/content', '../assets/img']; // content-collection images + the true masters
const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);
const TEXT_EXTS = new Set(['.html', '.xml', '.css', '.js', '.txt', '.json']);

const log = (m) => console.log(`[verify-assets] ${m}`);
const fail = (m) => {
	console.error(`\n[verify-assets] ✗ ${m}\n`);
	process.exit(1);
};

function walk(dir, acc = []) {
	if (!existsSync(dir)) return acc;
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) walk(p, acc);
		else acc.push(p);
	}
	return acc;
}

const md5 = (p) => createHash('md5').update(readFileSync(p)).digest('hex');

if (!existsSync(DIST)) fail(`no ${DIST}/ directory — run "astro build" first.`);

// 0. Defence-in-depth: the styleguide is dev-only and must never ship (also noindex + sitemap-excluded).
const styleguideDir = join(DIST, 'styleguide');
if (existsSync(styleguideDir)) {
	rmSync(styleguideDir, { recursive: true, force: true });
	log('removed dev-only dist/styleguide/ from production output.');
}

// 1. Collect every /_astro/<file> referenced by publishable output.
const referenced = new Set();
const refRe = /\/_astro\/([A-Za-z0-9._-]+)/g;
for (const file of walk(DIST)) {
	if (!TEXT_EXTS.has(extname(file).toLowerCase())) continue;
	const text = readFileSync(file, 'utf8');
	let m;
	while ((m = refRe.exec(text)) !== null) referenced.add(m[1]);
}

/* 1b. CLOSE OVER MODULE-TO-MODULE IMPORTS — the missing half of step 1, and a live bug from the moment a
   second page shares a bundle (P7.2 / D-48).
   Step 1 finds `/_astro/<file>` — the shape a reference takes in HTML, CSS and the import map. But a
   code-split chunk imports its SIBLINGS by a relative specifier (`import{g}from"./motion-math.<hash>.js"`),
   which carries no `/_astro/` prefix and is therefore invisible to that scan. Those chunks were then purged
   as "unreferenced" and the page 404'd at runtime.
   It stayed latent for as long as it did because it needs a SHARED chunk to exist: while `home-cinema.js`
   was GSAP's only consumer, Rollup inlined GSAP into that one bundle and there was no sibling import to
   miss. The moment `/diensten/` imported GSAP too, Rollup hoisted it into a shared chunk — and the build
   silently deleted it while reporting success. Step 3 could not catch it either: it verifies that every
   REFERENCED file exists, and these were never in the set.
   Walking the graph to a fixed point fixes both: the chunks survive, and step 3 becomes genuinely load-
   bearing, because a missing transitive dependency is now a missing *referenced* file and fails the build.
   The specifier regex is deliberately loose (any relative `./<name>.js` string literal, `import` or
   `import()` alike): over-matching only KEEPS a file, while under-matching ships a broken page. */
const modRe = /["'`]\.\/([A-Za-z0-9._-]+\.js)["'`]/g;
const queue = [...referenced].filter((f) => f.toLowerCase().endsWith('.js'));
while (queue.length) {
	const full = join(ASTRO_DIR, queue.pop());
	if (!existsSync(full)) continue;
	const text = readFileSync(full, 'utf8');
	let m;
	while ((m = modRe.exec(text)) !== null) {
		if (!referenced.has(m[1])) {
			referenced.add(m[1]);
			queue.push(m[1]);
		}
	}
}
log(`${referenced.size} distinct /_astro assets are referenced by the output.`);

// 2. Purge unreferenced files from dist/_astro (this removes the emitted originals).
let purged = 0;
if (existsSync(ASTRO_DIR)) {
	for (const file of readdirSync(ASTRO_DIR)) {
		const full = join(ASTRO_DIR, file);
		if (statSync(full).isFile() && !referenced.has(file)) {
			rmSync(full, { force: true });
			purged++;
		}
	}
}
log(`purged ${purged} unreferenced file(s) from dist/_astro.`);

// 3. Verify no broken references (every referenced derivative must still exist).
const missing = [...referenced].filter((f) => !existsSync(join(ASTRO_DIR, f)));
if (missing.length) fail(`broken asset reference(s), file(s) missing from dist/_astro: ${missing.join(', ')}`);
log('all referenced derivatives present — no broken references.');

// 4. DEFINITIVE GATE: hash source masters, then ensure none appear byte-identical anywhere in dist.
const sourceHashes = new Map(); // md5 -> source path
for (const dir of SOURCE_DIRS) {
	for (const file of walk(dir)) {
		if (SOURCE_EXTS.has(extname(file).toLowerCase())) sourceHashes.set(md5(file), file);
	}
}
log(`indexed ${sourceHashes.size} source master hash(es).`);

const leaked = [];
for (const file of walk(DIST)) {
	if (!SOURCE_EXTS.has(extname(file).toLowerCase())) continue;
	const h = md5(file);
	if (sourceHashes.has(h)) leaked.push(`${file}  ≡  ${sourceHashes.get(h)}`);
}
if (leaked.length) {
	fail(
		`PUBLISHED SOURCE MASTER(S) DETECTED (PH-08 violation) — byte-identical originals in dist:\n  ` +
			leaked.join('\n  '),
	);
}

log('✓ PH-08 satisfied: no source master is present in publishable output; derivatives intact.');
