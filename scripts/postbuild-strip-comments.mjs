/*
 * postbuild-strip-comments.mjs — the reasoning stays in the source; it stops being shipped (P14).
 *
 * WHY THIS EXISTS. This project deliberately keeps its reasoning next to the code, including in `.astro`
 * markup, where the explanation of a construction sits directly above it. That convention is good and is
 * not being changed. What it should not do is travel: an Astro HTML comment is emitted verbatim into the
 * built page, so every visitor downloads the argument for why an element is shaped the way it is.
 *
 * MEASURED on the built site before this step existed:
 *
 *     /portfolio/     28 comments   11.9 KB raw   5.4 KB gzipped   — 20% of the page's HTML
 *     21 routes                     50.9 KB raw
 *
 * That is more than the portfolio's entire JavaScript bundle, for bytes no browser can use. Removing them
 * is the largest free weight saving available on this site and it costs the codebase nothing: the comments
 * remain exactly where they are in `src/`, which is the only place they were ever for.
 *
 * WHAT IT WILL NOT TOUCH.
 *   · anything inside <script>, <style>, <pre> or <textarea>. A JavaScript block can legally contain the
 *     characters `<!--` (it is a legacy comment opener in classic scripts), a <pre> may be displaying
 *     markup as CONTENT, and a <style> block's contents are not HTML. Those regions are copied through
 *     byte-for-byte and never scanned.
 *   · downlevel-revealed / conditional comments (`<!--[if ...]>`), which are markup, not commentary.
 *   · anything that is not an HTML file in dist.
 *
 * It runs BEFORE postbuild-verify-assets.mjs on purpose: that step derives the set of referenced /_astro
 * assets from the built text, and an asset mentioned only inside a comment is not actually referenced by
 * the page. Stripping first makes the purge honest rather than defeating it.
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = 'dist';

function walk(dir, acc = []) {
	if (!existsSync(dir)) return acc;
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p, acc);
		else acc.push(p);
	}
	return acc;
}

/* Regions whose contents are not HTML and must be passed through untouched. */
const OPAQUE = /<(script|style|pre|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
/* An ordinary comment. `[if` is excluded so a conditional comment is left alone. */
const COMMENT = /<!--(?!\[if)[\s\S]*?-->/g;

function strip(html) {
	let out = '';
	let last = 0;
	let removed = 0;
	let bytes = 0;
	OPAQUE.lastIndex = 0;
	for (let m; (m = OPAQUE.exec(html)); ) {
		const before = html.slice(last, m.index);
		out += before.replace(COMMENT, (c) => {
			removed++;
			bytes += c.length;
			return '';
		});
		out += m[0]; // the opaque region, verbatim
		last = m.index + m[0].length;
	}
	out += html.slice(last).replace(COMMENT, (c) => {
		removed++;
		bytes += c.length;
		return '';
	});
	return { out, removed, bytes };
}

const files = walk(DIST).filter((f) => extname(f).toLowerCase() === '.html');
let totalComments = 0;
let totalBytes = 0;
for (const f of files) {
	const src = readFileSync(f, 'utf8');
	const { out, removed, bytes } = strip(src);
	if (!removed) continue;
	writeFileSync(f, out);
	totalComments += removed;
	totalBytes += bytes;
}
console.log(
	`[strip-comments] removed ${totalComments} HTML comment(s), ${(totalBytes / 1024).toFixed(1)} KB, ` +
		`across ${files.length} page(s). Source comments are untouched.`,
);
