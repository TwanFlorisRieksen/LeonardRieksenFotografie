// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// PLACEHOLDER PRODUCTION DOMAIN — RFC 2606 reserved (example.com), not a real or guessed domain.
// The actual production domain has no evidence in the blueprint or old-site inventory (see
// documenten/PROGRESS.md). This MUST be replaced with the confirmed production domain before the
// sitemap/canonical/OG URLs (SEO-05/SEO-06) can be considered production-accurate.
const SITE_URL = 'https://example.com';

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	output: 'static',
	// Blueprint 13.90/13.98: one consistent URL convention across the site (all sitemap routes end in "/").
	trailingSlash: 'always',
	integrations: [sitemap()],
});
