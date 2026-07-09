/** Business name — factual, confirmed in blueprint/old-site inventory. Not invented (CLAUDE §4.6). */
export const SITE_NAME = 'Leonard Rieksen Fotografie';

/**
 * SEO-04/10.47-10.55: unique title per page with a quality fallback (10.52) rather than a blank/duplicate
 * tag. Pages pass a specific title; this only supplies the consistent suffix.
 */
export function pageTitle(title: string): string {
	return `${title} — ${SITE_NAME}`;
}

/**
 * SEO-05/10.32-10.35: canonical URLs generated consistently from routing, never hand-typed per page.
 * Astro.url already reflects the configured trailingSlash: 'always' policy (astro.config.mjs).
 */
export function canonicalURL(astroSite: URL | undefined, astroUrl: URL): URL {
	const base = astroSite ?? astroUrl;
	return new URL(astroUrl.pathname, base);
}
