import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

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
 * - location/year   — ADDED IN P3: blueprint 12.41 names these as *possible* fields; they were
 *                      withheld at P1 because no real values existed yet (CLAUDE §4.6/§9.2). P3's
 *                      representative-project selection surfaced real evidence for both (the
 *                      photographer's own consistent shoot-folder naming convention, e.g.
 *                      "20140914 , Architectuurfotografie , Arnhem" — a real authored record, not
 *                      an invention), so they are added now as optional metadata tags. Left empty
 *                      for entries where no such evidence exists (never guessed).
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
			location: z.string().optional(),
			year: z.number().optional(),
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
			// P6 recovery (D-34): bounded opening treatment for the detail page. A small enum, NOT a
			// per-page layout hack — it selects one of a coherent set of lead compositions so different
			// projects open with genuinely different rhythm while staying one maintainable template.
			// 'cinematic'  = wide lead image shown whole, title set beneath it (for wide/strong covers);
			// 'editorial'  = quiet typographic opening (title + story) THEN the photography (calm series);
			// 'duo-lead'   = lead image paired with the first gallery image up top (relational openers).
			leadLayout: z.enum(['cinematic', 'editorial', 'duo-lead']).default('cinematic'),
			draft: z.boolean().default(false),
			seoTitle: z.string().optional(),
			seoDescription: z.string().optional(),
			socialImage: image().optional(),
		}),
});

/**
 * Standalone portfolio works (P6 recovery — D-34). A single-file data collection: every image in the
 * source portfolio that does NOT belong to a genuine multi-image series lives here as one curated "work",
 * so ALL authorised portfolio photography is published (the P6-recovery requirement), not just the images
 * that happened to group into projects. Kept as ONE YAML file (not 47 folders) so it stays maintainable and
 * Decap-editable as a list; images are colocated next to works.yaml so the relative `./slug.jpg` path
 * resolves identically for Astro's image() helper and a future CMS upload.
 *
 * - image(+alt)  — the photograph and its truthful alt text (PH-14; never derived from filename).
 * - category     — authoritative (old gallery.json); drives the arch/interior arrangement + label.
 * - scale        — curatorial hierarchy hint (feature|standard|quiet). It biases how prominently the
 *                  overview composes the work; the actual block geometry is still driven by the image's
 *                  REAL orientation (portfolio.ts), so presentation follows the photograph, not a template.
 * - caption/location/year — shown only where filename + photo agree (empty otherwise; never guessed).
 */
const works = defineCollection({
	// Stored as a single keyed JSON file ({ "works": [...] }) so Decap can edit it as a `files` collection
	// with one list field, while Astro reads the nested array via a tiny native parser (no YAML dependency).
	// Images are colocated next to the file, so `./slug.jpg` resolves identically for image() and a CMS upload.
	loader: file('./src/content/portfolio/works.json', {
		parser: (text) => (JSON.parse(text) as { works: Record<string, unknown>[] }).works,
	}),
	schema: ({ image }) =>
		z.object({
			image: image(),
			alt: z.string(),
			category: z.enum(['architectuur', 'interieur']),
			scale: z.enum(['feature', 'standard', 'quiet']).default('standard'),
			caption: z.string().optional(),
			location: z.string().optional(),
			year: z.number().optional(),
		}),
});

export const collections = { projects, works };
