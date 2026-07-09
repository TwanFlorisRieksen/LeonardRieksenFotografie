import type { APIRoute } from 'astro';

// SEO-06/13.163: generated from the same site config as the sitemap, not hand-maintained separately.
export const GET: APIRoute = ({ site }) => {
	const sitemapURL = new URL('sitemap-index.xml', site);
	const body = `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${sitemapURL}\n`;
	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
