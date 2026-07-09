import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Project content model (R-06 / CMS-03 / ARCH-07).
 *
 * Every field below exists for a concrete routing, SEO, accessibility, editorial, or
 * storytelling reason (blueprint 12.41/12.47; CLAUDE §10.1 — no field without a use).
 * Fields the blueprint lists as *possible* (12.41: locatie, jaar) are deliberately NOT
 * included yet: no real values exist for them, and CLAUDE §4.6/§9.2 forbids inventing
 * business facts. Add them when the user supplies real project data (P6).
 *
 * - title           — H1 / nav label / fallback SEO title source.
 * - category        — drives the Portfolio filter (Alles/Architectuur/Interieur, PH-11)
 *                      and which Diensten page cross-links here.
 * - summary         — short storytelling intro (12.42); also the SEO description fallback.
 * - coverImage(+Alt)— used on the Portfolio grid and as the social-image fallback.
 * - gallery         — ordered image set; list order IS the curated sequence (PH-15);
 *                      each image carries its own alt text (PH-14 — never derived from filename).
 * - featured        — mirrors the old gallery.json flag; lets curated pages (e.g. future
 *                      homepage selection) pull a subset without a second data source (12.48).
 * - order           — manual override for cases where publish order isn't the wanted
 *                      curation order on the Portfolio overview.
 * - draft           — publish/unpublished state (12.90 workflow states) — draft entries
 *                      must not generate a public route.
 * - seoTitle/seoDescription/socialImage — optional per-page overrides (12.51); fall back
 *                      to title/summary/coverImage when empty (12.52 — quality fallback,
 *                      never a blank/missing tag).
 */
const projects = defineCollection({
	// One folder per project, `index.md` + colocated images (cover.jpg, gallery-*.jpg). This matches
	// Decap's documented default folder-collection media behaviour (media_folder: '' → media saved
	// next to the entry, relative paths) so a CMS-uploaded image and Astro's `image()` schema helper
	// resolve the exact same relative path — no media_folder/public_folder mismatch (see DECISIONS.md).
	// generateId strips the trailing "/index" so the route slug is the project folder name, not "x/index".
	loader: glob({
		pattern: '**/index.md',
		base: './src/content/projects',
		generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
	}),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			category: z.enum(['architectuur', 'interieur']),
			summary: z.string(),
			coverImage: image(),
			coverImageAlt: z.string(),
			gallery: z
				.array(
					z.object({
						image: image(),
						alt: z.string(),
						caption: z.string().optional(),
					}),
				)
				.default([]),
			featured: z.boolean().default(false),
			order: z.number().default(0),
			draft: z.boolean().default(false),
			seoTitle: z.string().optional(),
			seoDescription: z.string().optional(),
			socialImage: image().optional(),
		}),
});

export const collections = { projects };
