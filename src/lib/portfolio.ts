/*
 * Portfolio composition (P6 recovery #2 — D-35).
 *
 * WHY THIS REPLACES THE D-34 SPINE
 * --------------------------------
 * D-34 published all 74 photographs as ONE flat vertical "exhibition" whose only structure was a
 * per-image block shape (statement / wide / duo / quiet / single / series). Rendered, that read as a
 * 35-screen stack of near-fullscreen photographs on flat black: not scannable, no visible sections, and
 * none of the site's established brand grammar (atmosphere fields, gold seams, tonal surface steps).
 * Product-owner rejected it. The lightbox already provides the enlarged-view mode, so the OVERVIEW does
 * not need to show images near-fullscreen — it must be a scannable, chaptered INDEX of the body of work.
 *
 * THE NEW MODEL
 * -------------
 * The overview is organised into a small number of truthful CHAPTERS — Projecten, Architectuur, Interieur
 * — each introduced by a header (eyebrow + title + count + gold seam) on its own tonal surface. Chapters
 * make the information architecture legible (what is a project vs a loose work; which discipline you are
 * looking at) and give recurring orientation anchors. Category is thereby STRUCTURAL, not a label repeated
 * under every image.
 *
 * Within a works chapter, photography is laid out as JUSTIFIED ROWS: a greedy row-packer groups images by
 * their REAL aspect ratio so each row shares one height and fills the width (flex-grow ∝ aspect ratio in
 * CSS). Images are shown WHOLE — no crop (the D-34 content-integrity win is kept) — but at restrained
 * heights, so many images are visible per screen. Periodic wide `feature` images are promoted to full-width
 * ANCHOR rows: the deliberate "big moments" that carry scale-contrast and rhythm, spaced so they punctuate
 * rather than dominate. So variation still comes from the photography (orientation + curatorial scale), but
 * the page now has genuine composition, density and hierarchy instead of one-photo-per-screen.
 *
 * Maintainability: works order is the curatorial order in works.json; block geometry is DERIVED here. Any
 * work not otherwise placed is still emitted (the P6-recovery guarantee: every image stays published).
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

export type Orientation = 'pano' | 'landscape' | 'square' | 'portrait';

/** Orientation from the real pixels — this is what makes presentation follow the photograph. */
export function orientationOf(img: ImageMetadata): Orientation {
	const r = img.width / img.height;
	if (r > 1.7) return 'pano';
	if (r > 1.15) return 'landscape';
	if (r > 0.87) return 'square';
	return 'portrait';
}

/** A single displayable tile — the shared shape the justified packer works over. */
export interface Tile {
	image: ImageMetadata;
	alt: string;
	caption?: string;
	orientation: Orientation;
	/** Clamped aspect ratio (w/h). Clamped so one extreme frame can't blow a row's height out. */
	ar: number;
}

export interface WorkTile extends Tile {
	id: string;
	category: 'architectuur' | 'interieur';
	scale: 'feature' | 'standard' | 'quiet';
	location?: string;
	year?: number;
}

/**
 * A composed layout node. `anchor` = one wide image shown full-frame (a big moment). `row` = a justified
 * row of 1‑N images sharing a height. This same vocabulary drives both the overview works chapters and the
 * project-detail beeldreeks, so the two surfaces read as one system.
 */
export type MediaNode<T extends Tile = Tile> =
	| { type: 'anchor'; item: T }
	| { type: 'row'; items: T[] };

/** Aspect ratio, clamped so a freak panorama/portrait can't dominate a justified row's height. */
function arOf(img: ImageMetadata): number {
	const r = img.width / img.height;
	return Math.max(0.5, Math.min(3.2, r));
}

/**
 * Greedy justified-row packer. Groups tiles so each row's summed aspect ratio reaches a (cycling) target,
 * which — because CSS sizes each tile's width in proportion to its aspect ratio — yields a controlled band
 * of row heights and a designed density variation down the page. Wide `feature` tiles are lifted out as
 * full-width anchors, spaced by `minGap` tiles so the big moments punctuate rather than clump.
 */
function justify<T extends Tile & { scale?: WorkTile['scale'] }>(
	items: T[],
	opts: { targets?: number[]; anchor?: (t: T) => boolean; minGap?: number } = {},
): MediaNode<T>[] {
	const targets = opts.targets ?? [3.3, 4.4, 3.8];
	const isAnchor = opts.anchor ?? (() => false);
	const minGap = opts.minGap ?? 3;

	const nodes: MediaNode<T>[] = [];
	let buf: T[] = [];
	let bufAr = 0;
	let ti = 0;
	let target = targets[0];
	let sinceAnchor = minGap; // allow an anchor immediately if the first item qualifies

	const flush = () => {
		if (buf.length) {
			nodes.push({ type: 'row', items: buf });
			buf = [];
			bufAr = 0;
			ti++;
			target = targets[ti % targets.length];
		}
	};

	for (const it of items) {
		if (isAnchor(it) && sinceAnchor >= minGap) {
			flush();
			nodes.push({ type: 'anchor', item: it });
			sinceAnchor = 0;
			continue;
		}
		// Overshoot guard: if the row is already near its target, don't let a wide frame pile on and squash
		// the whole row's height (which on a narrow tablet container produced thumbnail-thin rows). Flush
		// first so the wide frame opens a fresh row instead. This caps a row's summed aspect ratio, keeping
		// row heights in a premium band across viewport widths.
		if (buf.length && bufAr >= target - 0.7 && bufAr + it.ar > target + 0.9) flush();
		buf.push(it);
		bufAr += it.ar;
		sinceAnchor++;
		if (bufAr >= target) flush();
	}

	// Trailing remainder: fold a too-thin last row back into the previous row so no lone frame is left to
	// stretch to a full-width (tall) beat. If the previous node is an anchor, keep it as its own contained
	// row (CSS caps a solo row's width so it stays a calm centred single, never a giant).
	if (buf.length) {
		const last = nodes[nodes.length - 1];
		if (bufAr < 2.6 && last && last.type === 'row') last.items.push(...buf);
		else nodes.push({ type: 'row', items: buf });
	}
	return nodes;
}

/* ------------------------------------------------------------------ *
 * Project-detail galleries — the same justified system, scoped to one project's beeldreeks. A pano gallery
 * frame becomes a full-width anchor (one big moment); the rest justify into rows. Replaces the old
 * plate/pair/portrait stack that rendered as a PDF-like vertical sequence.
 * ------------------------------------------------------------------ */
export type GalleryTile = Tile;

export function composeGallery(
	photos: { image: ImageMetadata; alt: string; caption?: string }[],
): MediaNode<GalleryTile>[] {
	const tiles: GalleryTile[] = photos.map((p) => ({
		...p,
		orientation: orientationOf(p.image),
		ar: arOf(p.image),
	}));
	// Slightly denser targets than the overview (project galleries are short, so keep 2‑up rhythm), panos
	// promoted to anchors with no spacing constraint (a short gallery earns its big moment).
	return justify(tiles, { targets: [2.9, 3.6], anchor: (t) => t.orientation === 'pano', minGap: 0 });
}

function toWorkTile(w: CollectionEntry<'works'>): WorkTile {
	return {
		id: w.id,
		image: w.data.image,
		alt: w.data.alt,
		caption: w.data.caption,
		category: w.data.category,
		scale: w.data.scale,
		location: w.data.location,
		year: w.data.year,
		orientation: orientationOf(w.data.image),
		ar: arOf(w.data.image),
	};
}

export interface OverviewChapter {
	id: 'architectuur' | 'interieur';
	label: string;
	count: number;
	nodes: MediaNode<WorkTile>[];
}

export interface Overview {
	projects: CollectionEntry<'projects'>[];
	chapters: OverviewChapter[];
	total: number; // distinct photographs discoverable through the whole overview (works + project images)
	workCount: number;
	seriesCount: number;
	seriesImageCount: number;
}

export async function getOverview(): Promise<Overview> {
	const works = await getCollection('works');
	const projects = (await getCollection('projects', ({ data }) => !data.draft)).sort(
		(a, b) => a.data.order - b.data.order,
	);

	const tiles = works.map(toWorkTile);
	const arch = tiles.filter((t) => t.category === 'architectuur');
	const inter = tiles.filter((t) => t.category === 'interieur');

	// A wide `feature` frame earns a full-width anchor; spacing differs by chapter size so the small
	// interieur chapter isn't over-punctuated.
	const wideFeature = (t: WorkTile) => t.scale === 'feature' && t.ar > 1.6;

	const chapters: OverviewChapter[] = [
		{
			id: 'architectuur',
			label: 'Architectuur',
			count: arch.length,
			nodes: justify(arch, { anchor: wideFeature, minGap: 4 }),
		},
		{
			id: 'interieur',
			label: 'Interieur',
			count: inter.length,
			nodes: justify(inter, { targets: [2.9, 3.6], anchor: wideFeature, minGap: 3 }),
		},
	];

	const seriesImageCount = projects.reduce((n, p) => n + 1 + p.data.gallery.length, 0);

	return {
		projects,
		chapters,
		total: works.length + seriesImageCount,
		workCount: works.length,
		seriesCount: projects.length,
		seriesImageCount,
	};
}
