/*
 * Portfolio composition (P6 recovery — D-34).
 *
 * The portfolio must present ALL authorised photography (74 images) as ONE curated premium exhibition,
 * and its variation must come from the PHOTOGRAPHY, not from a repeating template. So this module derives
 * each image's REAL orientation from its intrinsic dimensions and composes an ordered sequence of BLOCKS
 * whose geometry follows that orientation + a curatorial scale hint:
 *
 *   statement  — one image, full-bleed wide (panoramas + `feature` works + featured series covers)
 *   duo        — two images side by side, deliberately unequal (portrait ↔ landscape interplay)
 *   quiet      — a small run (1–3) of contained images with air around them (punctuation)
 *   single     — one contained image at reading width (a calm standard beat)
 *   series     — a genuine multi-image project: lead + preview strip, links to its detail page
 *
 * The result is a designed rhythm: no two adjacent blocks share a shape by accident, big moments are
 * spaced, and the weaker daytime/abstract frames are given honest hierarchy (quiet) rather than being
 * EXCLUDED — the P6-recovery rule is "use hierarchy, not exclusion; publish every image".
 *
 * Maintainability: the curated ORDER lives in ONE data array (SPINE); block SHAPE is computed. Any work
 * not named in the spine is still appended and composed, so an image can never silently drop out.
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

export interface PhotoItem {
	kind: 'work';
	id: string;
	image: ImageMetadata;
	alt: string;
	caption?: string;
	category: 'architectuur' | 'interieur';
	scale: 'feature' | 'standard' | 'quiet';
	location?: string;
	year?: number;
	orientation: Orientation;
}

export type Block =
	| { type: 'statement'; item: PhotoItem } // full-bleed impact beat (the "wow" images)
	| { type: 'wide'; item: PhotoItem } // a big image held within the frame (panoramas that read calmer)
	| { type: 'duo'; items: [PhotoItem, PhotoItem] } // two unequal images, portrait/landscape interplay
	| { type: 'quiet'; items: PhotoItem[] } // 1–3 small contained images — punctuation
	| { type: 'single'; item: PhotoItem }
	| { type: 'series'; project: CollectionEntry<'projects'> };

/**
 * Curated spine — the editorial ORDER of the exhibition. Tokens are either a work `id` or
 * `series:<slug>`. This is the one place a curator sets sequence; block geometry is derived below.
 * Ordering is chosen so standards sit next to portraits (forming portrait↔landscape duos), big
 * statements are spaced, series punctuate, and the weaker park/abstract frames cluster as quiet beats.
 */
type Spine =
	| { statement: string }
	| { wide: string }
	| { single: string }
	| { duo: [string, string] }
	| { quiet: string[] }
	| { series: string };

const SPINE: Spine[] = [
	{ statement: 'brug-avondrood' },
	{ series: 'arnhem-stadsarchitectuur' },
	{ duo: ['baksteen-woontoren', 'modern-gebouw-schemering'] },
	{ statement: 'glasgevel-kleurvlakken' },
	{ duo: ['oranje-gevel-verticaal', 'glasgevel-avondlicht'] },
	{ series: 'avond-en-blauw-uur' },
	{ statement: 'nemo-amsterdam' },
	{ duo: ['olv-toren-amersfoort', 'witte-villa-park'] },
	{ wide: 'zonnepanelen-veld' },
	{ statement: 'westerveld-koepel' },
	{ series: 'kroller-muller-paviljoen' },
	{ duo: ['stadsstraat-schemering', 'glazen-paviljoen'] },
	{ statement: 'skyline-schemering' },
	{ quiet: ['lindenlaan-baarn', 'wintertuin-cantonspark'] },
	{ series: 'amersfoort-stad' },
	{ duo: ['baarnsche-bos-boog', 'kerk-deventer-avond'] },
	{ statement: 'tuibrug-blauwe-uur' },
	{ wide: 'modernistische-gevel-zw' },
	{ duo: ['interieurdetail-licht', 'tunnel-warm-eindpunt'] },
	{ series: 'rotterdam-skyline-kubuswoningen' },
	{ statement: 'nachtbeeld-blauw-licht' },
	{ duo: ['gebogen-lichtruimte', 'gebouw-avond-vierkant'] },
	{ statement: 'gebouw-spiegeling-water' },
	{ wide: 'industriele-oever-nacht' },
	{ quiet: ['zeilboot-haven', 'parkboom-daglicht'] },
	{ statement: 'brug-skyline-blauwe-uur' },
	{ series: 'interieur-ruimte-en-licht' },
	{ duo: ['lichtlijnen-roze', 'witte-zaal-boog'] },
	{ statement: 'witte-gang-lang' },
	{ duo: ['gewelfde-hal-warm', 'monumentale-zaal'] },
	{ duo: ['eemhuis-bibliotheek', 'interieurgang-warm'] },
	{ series: 'woonbeurs-rai-amsterdam' },
	{ statement: 'soestdijk-lichtshow' },
	{ series: 'kees-smit-amersfoort' },
	{ duo: ['lichtkunst-groen', 'baksteenarchitectuur-water'] },
	{ statement: 'gevel-warm-blauwe-uur' },
	{ wide: 'skyline-woonbebouwing' },
	{ quiet: ['parkscene-bomen', 'parklaan-pad'] },
	{ statement: 'waterfront-panorama' },
	{ wide: 'stadsgezicht-nacht' },
	{ quiet: ['lichtbol-studie'] },
];

/* ------------------------------------------------------------------ *
 * Project detail galleries — the same "photography drives the layout" idea, scoped to one project's
 * beeldreeks. A short gallery is composed into a varied sequence (wide statements, portrait pairs,
 * contained plates) so two projects with different image mixes read with genuinely different rhythm.
 * ------------------------------------------------------------------ */
export interface GalleryPhoto {
	image: ImageMetadata;
	alt: string;
	caption?: string;
	orientation: Orientation;
}
export type GalleryBlock =
	| { type: 'wide'; item: GalleryPhoto }
	| { type: 'pair'; items: [GalleryPhoto, GalleryPhoto] }
	| { type: 'portrait'; item: GalleryPhoto }
	| { type: 'plate'; item: GalleryPhoto };

export function composeGallery(
	photos: { image: ImageMetadata; alt: string; caption?: string }[],
): GalleryBlock[] {
	const items: GalleryPhoto[] = photos.map((p) => ({ ...p, orientation: orientationOf(p.image) }));
	const out: GalleryBlock[] = [];
	let i = 0;
	let first = true; // the first image opens the sequence solo (a strong, whole plate), never paired
	const isWideish = (o: Orientation) => o === 'landscape' || o === 'square';
	while (i < items.length) {
		const it = items[i];
		const next = items[i + 1];
		if (it.orientation === 'pano') {
			out.push({ type: 'wide', item: it });
			i++;
		} else if (it.orientation === 'portrait') {
			if (next && next.orientation === 'portrait') {
				out.push({ type: 'pair', items: [it, next] });
				i += 2;
			} else {
				out.push({ type: 'portrait', item: it });
				i++;
			}
		} else if (!first && next && isWideish(next.orientation)) {
			// two consecutive landscape/square frames → a side-by-side beat (2-up rhythm, each still whole)
			out.push({ type: 'pair', items: [it, next] });
			i += 2;
		} else {
			out.push({ type: 'plate', item: it });
			i++;
		}
		first = false;
	}
	return out;
}

function toItem(w: CollectionEntry<'works'>): PhotoItem {
	return {
		kind: 'work',
		id: w.id,
		image: w.data.image,
		alt: w.data.alt,
		caption: w.data.caption,
		category: w.data.category,
		scale: w.data.scale,
		location: w.data.location,
		year: w.data.year,
		orientation: orientationOf(w.data.image),
	};
}

export interface Overview {
	blocks: Block[];
	total: number; // total distinct photographs discoverable through the exhibition (works + series images)
	workCount: number;
	seriesCount: number;
}

export async function getOverview(): Promise<Overview> {
	const works = await getCollection('works');
	const projects = (await getCollection('projects', ({ data }) => !data.draft)).sort(
		(a, b) => a.data.order - b.data.order,
	);

	const workById = new Map(works.map((w) => [w.id, toItem(w)]));
	const projById = new Map(projects.map((p) => [p.id, p]));
	const usedWorks = new Set<string>();
	const usedSeries = new Set<string>();
	const take = (id: string): PhotoItem | undefined => {
		const it = workById.get(id);
		if (it && !usedWorks.has(id)) {
			usedWorks.add(id);
			return it;
		}
		return undefined;
	};

	const blocks: Block[] = [];
	for (const s of SPINE) {
		if ('series' in s) {
			const p = projById.get(s.series);
			if (p && !usedSeries.has(s.series)) {
				usedSeries.add(s.series);
				blocks.push({ type: 'series', project: p });
			}
		} else if ('statement' in s) {
			const it = take(s.statement);
			if (it) blocks.push({ type: 'statement', item: it });
		} else if ('wide' in s) {
			const it = take(s.wide);
			if (it) blocks.push({ type: 'wide', item: it });
		} else if ('single' in s) {
			const it = take(s.single);
			if (it) blocks.push({ type: 'single', item: it });
		} else if ('duo' in s) {
			const a = take(s.duo[0]);
			const b = take(s.duo[1]);
			if (a && b) blocks.push({ type: 'duo', items: [a, b] });
			else if (a) blocks.push({ type: 'single', item: a });
			else if (b) blocks.push({ type: 'single', item: b });
		} else if ('quiet' in s) {
			const items = s.quiet.map(take).filter((x): x is PhotoItem => !!x);
			if (items.length) blocks.push({ type: 'quiet', items });
		}
	}

	// Safety net (P6-recovery guarantee): any work NOT named in the spine is still published — grouped
	// into calm quiet rows so an image can NEVER silently drop out of the exhibition.
	const leftovers = works.map((w) => w.id).filter((id) => !usedWorks.has(id));
	for (let i = 0; i < leftovers.length; i += 3) {
		const items = leftovers.slice(i, i + 3).map(take).filter((x): x is PhotoItem => !!x);
		if (items.length) blocks.push({ type: 'quiet', items });
	}
	for (const p of projects) {
		if (!usedSeries.has(p.id)) {
			usedSeries.add(p.id);
			blocks.push({ type: 'series', project: p });
		}
	}

	const seriesImageCount = projects.reduce((n, p) => n + 1 + p.data.gallery.length, 0);

	return {
		blocks,
		total: works.length + seriesImageCount,
		workCount: works.length,
		seriesCount: projects.length,
	};
}
