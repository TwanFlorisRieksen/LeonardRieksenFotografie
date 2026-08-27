// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/*
 * THE PRODUCTION DOMAIN IS AN INPUT, NOT A CONSTANT (P9 / D-80).
 *
 * Every absolute URL the site emits — canonicals, the sitemap, Open Graph, the structured-data @ids —
 * derives from this one value. Until now it was a hard-coded RFC-2606 placeholder, so shipping the real
 * domain meant editing source. It is now read from the environment, which is where Netlify already keeps
 * per-site configuration: setting `SITE_URL` in the Netlify UI (Site configuration -> Environment
 * variables) makes every URL on the site correct on the next deploy, with no code change.
 *
 * The placeholder remains the fallback so local builds and deploy previews keep working, and the build
 * says loudly when it is in use — a silent example.com in a production sitemap is exactly the failure
 * this guards against. The actual domain still has no evidence in the blueprint or the old-site
 * inventory, so it is NOT guessed here; it is the one external value the owner must supply (SEO-05/06).
 */
const PLACEHOLDER_SITE = 'https://example.com';
const SITE_URL = (process.env.SITE_URL || PLACEHOLDER_SITE).replace(/\/+$/, '');
if (SITE_URL === PLACEHOLDER_SITE) {
	console.warn(
		'\n[site-url] Building with the PLACEHOLDER domain ' +
			PLACEHOLDER_SITE +
			'.\n[site-url] Canonicals, sitemap, Open Graph and structured data will NOT be production-accurate.' +
			'\n[site-url] Set the SITE_URL environment variable to the confirmed production domain.\n',
	);
}

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	output: 'static',
	// Blueprint 13.90/13.98: one consistent URL convention across the site (all sitemap routes end in "/").
	trailingSlash: 'always',
	integrations: [
		sitemap({
			/*
			 * A sitemap states "these are the URLs I want indexed", so it must not contain a URL the page
			 * itself tells crawlers not to index — that is a contradiction a crawler reports as an error.
			 * Excluded:
			 *   /styleguide  — dev-only design-system showcase, also noindex, and stripped from production
			 *                  output entirely by scripts/postbuild-verify-assets.mjs.
			 *   /bedankt     — the form-success page (P9 / D-80). It carries `noindex` and is reachable only
			 *                  by submitting the contact form; it was nevertheless being submitted for
			 *                  indexing. It has no standalone value to a searcher and is now excluded.
			 */
			filter: (page) => !page.includes('/styleguide') && !page.includes('/bedankt'),
		}),
	],
});
