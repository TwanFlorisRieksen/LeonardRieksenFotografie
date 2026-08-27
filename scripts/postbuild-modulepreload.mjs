/*
 * postbuild-modulepreload.mjs — removes a full round-trip from every page that has motion (P9 / D-80).
 *
 * THE PROBLEM, measured on the built site. Astro emits each page's `<script>` as a small module and
 * code-splits its shared dependency — here GSAP + ScrollTrigger, 113 KB raw / 44 KB on the wire — into its
 * own chunk. It emits NO resource hint for that chunk. So the browser discovers it in three serial hops:
 *
 *     HTML (found at 0 ms) → page entry module (1.6 KB, requested at ~92 ms) → ScrollTrigger chunk
 *     (44 KB, only requested at ~142 ms, once the entry has been fetched AND parsed)
 *
 * The motion runtime therefore cannot start until an extra round-trip plus 44 KB has completed, and on a
 * real connection that is the interval in which the page has painted but the world has not arrived — one
 * of the specific things that reads as "waiting for something".
 *
 * THE FIX. A `<link rel="modulepreload">` in <head> for the entry's static imports moves that chunk into
 * the FIRST round-trip, discovered by the preload scanner alongside the CSS, at the correct (high) module
 * priority. Nothing else changes: same bytes, same code-splitting, same cache keys. This is exactly the
 * hint Vite emits for its own entry chunks and Astro does not emit for page scripts.
 *
 * WHY A BUILD STEP AND NOT MARKUP. The chunk's filename is content-hashed and only exists after the build,
 * so no `.astro` file can name it. Reading the built module graph is the only way to state it truthfully —
 * and it stays true automatically when the dependency changes.
 *
 * DELIBERATELY CONSERVATIVE. Only STATIC imports of a page's own entry modules are hinted, transitively.
 * Dynamic `import()` is left alone: it is deferred on purpose, and preloading it would undo that. Pages
 * without a module script get no hints at all (the blueprint's warning that excessive preload makes the
 * critical path worse — 11.x — is the reason this is not a blanket "preload everything").
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const ASTRO_DIR = join(DIST, '_astro');
const log = (m) => console.log(`[modulepreload] ${m}`);

function walk(dir, acc = []) {
	if (!existsSync(dir)) return acc;
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		statSync(p).isDirectory() ? walk(p, acc) : acc.push(p);
	}
	return acc;
}

/* Static import specifiers only. Rollup emits them as `from"./chunk.js"` / `import"./chunk.js"`; a dynamic
   import is `import("./chunk.js")` and is excluded by requiring no `(` before the quote. */
const STATIC_IMPORT = /(?:^|[^(\w$])(?:from|import)\s*["'](\.\/[A-Za-z0-9._-]+\.js)["']/g;

const depsCache = new Map();
function staticDeps(file, seen = new Set()) {
	if (depsCache.has(file)) return depsCache.get(file);
	const out = [];
	const p = join(ASTRO_DIR, file);
	if (!existsSync(p)) return out;
	const src = readFileSync(p, 'utf8');
	for (const m of src.matchAll(STATIC_IMPORT)) {
		const dep = m[1].slice(2); // strip "./"
		if (seen.has(dep)) continue;
		seen.add(dep);
		out.push(dep, ...staticDeps(dep, seen));
	}
	depsCache.set(file, out);
	return out;
}

let pagesTouched = 0;
let hintsAdded = 0;

for (const page of walk(DIST).filter((f) => f.endsWith('.html'))) {
	const html = readFileSync(page, 'utf8');
	const entries = [...html.matchAll(/<script[^>]+type="module"[^>]+src="\/_astro\/([A-Za-z0-9._-]+\.js)"/g)].map(
		(m) => m[1],
	);
	if (!entries.length) continue;

	/*
	 * P13 (D-85): THE ENTRY MODULES ARE HINTED TOO, NOT ONLY THEIR SHARED CHUNKS.
	 *
	 * This step used to delete the entries from the hint set, on the reasoning that the page already loads
	 * them directly so a hint would be a duplicate request. That is not what a `modulepreload` does: the
	 * <script> and the <link> resolve to the SAME module-map entry, so it is one fetch either way. What the
	 * hint changes is WHEN the fetch is discovered and at what priority — and Astro emits page scripts at
	 * the END of <body>, where the preload scanner reaches them only after every stylesheet, font and
	 * markup-declared image ahead of them.
	 *
	 * MEASURED on the built site, 390pt phone at dpr 3, cold cache, 1.6 Mbps, CPU throttled 4x, loading
	 * /portfolio/: the page's own 19 KB entry — which contains the traverse engine, and which is the thing
	 * that decides which photographs to request at what size — was not requested until 3019 ms and did not
	 * land until 3206 ms. Until then nothing in the coil could be fetched at all, and the entrance curtain
	 * ran to its 4.2s hard cap. The engine was queued behind the fonts, the CSS, the wordmark and the crown
	 * imagery, none of which it depends on.
	 *
	 * This is the same hint Vite emits for its own entry chunks; Astro simply does not emit it for page
	 * scripts. Entries are listed FIRST so the engine is discovered before its shared dependencies.
	 */
	const deps = new Set(entries);
	for (const e of entries) for (const d of staticDeps(e)) deps.add(d);
	const fresh = [...deps].filter((d) => !html.includes(`rel="modulepreload" href="/_astro/${d}"`));
	if (!fresh.length) continue;

	const links = fresh.map((d) => `<link rel="modulepreload" href="/_astro/${d}">`).join('');
	const idx = html.indexOf('</head>');
	if (idx === -1) continue;
	writeFileSync(page, html.slice(0, idx) + links + html.slice(idx));
	pagesTouched += 1;
	hintsAdded += fresh.length;
}

log(
	pagesTouched
		? `added ${hintsAdded} modulepreload hint(s) across ${pagesTouched} page(s) — page entries and their shared chunks now load in the first round-trip.`
		: 'no page module scripts with shared static chunks — nothing to hint.',
);
