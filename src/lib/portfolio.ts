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

/**
 * THE DEPTH OF ATTENTION — Spatial Interaction Architecture §4.3, §8.3.
 *
 * "How important a photograph is, is how close it hangs." The curator's existing scale becomes the
 * work's depth station, and that is the ENTIRE rule: depth is never randomised, never assigned by
 * index, never varied for visual interest, and never computed from aspect ratio, filename, date or
 * position. A photograph's depth is a statement about the photograph.
 *
 * The consequence is the strongest argument for the whole spatial architecture: it requires no new
 * data model, no new authoring burden and no new curatorial vocabulary. Leo curates exactly as
 * before — `feature` / `standard` / `quiet` in works.json — and the world reads his curation as
 * geometry. Three stations exist and no fourth may be added without a decision record (§4.3.1).
 */
export type Station = 'near' | 'reading' | 'far';

export const stationOf = (scale: WorkTile['scale']): Station =>
	scale === 'feature' ? 'near' : scale === 'quiet' ? 'far' : 'reading';

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
	/** Curator-designated opening photograph of the portfolio (§3.1). At most one work carries it. */
	overture: boolean;
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

/**
 * The photograph's TRUE aspect ratio.
 *
 * This used to be clamped to [0.5, 3.2] to stop a freak frame dominating a row's height. But `--ar` is what
 * CSS sizes the cell with, so clamping it makes the layout believe a shape the photograph does not have —
 * and a justified row only shares one height if every cell's ratio is the real one. Measured at 1440px, the
 * 1700×305 night panorama (true ratio 5.57, clamped to 3.2) rendered 884×159 beside a rowmate more than
 * twice its height: the shortest photograph in the index, and a direct contradiction of §8's shared row
 * height, which is what keeps different aspect ratios genuinely comparable.
 *
 * The clamp still exists — but only inside the packer's arithmetic (`packAr`), where its actual job is, and
 * a frame too wide to share a row at all is given the whole width as an anchor instead of being squeezed.
 */
function arOf(img: ImageMetadata): number {
	return img.width / img.height;
}

/** The widest ratio a photograph can have and still share a row without crushing it. */
const AR_ROW_MAX = 3.2;

/** Ratio as the row packer should reason about it — extremes clamped so one frame can't skew a target. */
const packAr = (ar: number) => Math.max(0.5, Math.min(AR_ROW_MAX, ar));

/* ------------------------------------------------------------------ *
 * THE WALL ALLOCATION RULE — Experience Architecture §4.3
 *
 * "The wall is allocated per chapter, not per photograph. A chapter always receives a substantial stretch
 *  of wall; its photographs divide that stretch among themselves. Fewer photographs → each is hung larger.
 *  More photographs → tighter rows, more per screen."
 *
 * Expressed as a computation: a row's density is its summed aspect ratio (CSS sizes each cell's width in
 * proportion to its AR, so all cells in a row share one height — a HIGHER summed AR means more, smaller
 * photographs in that row). So "how large is this chapter hung?" is exactly "what summed-AR do its rows
 * target?", and the rule becomes:
 *
 *     rows   = max(MIN_ROWS, round(totalAr / IDEAL))     ← every chapter gets a substantial stretch
 *     target = clamp(totalAr / rows, MIN_TARGET, MAX_TARGET)
 *
 * MEASURED IN THE RENDER at 1440×900, which is the only place this rule is either true or false:
 *   architectuur — 40 works · 2.0 photographs per row · 4 full-width anchors · median frame 432px
 *   interieur    —  7 works · 1.0 photograph  per row · 1 full-width anchor  · median frame 522px
 * Seven interior photographs occupy 4,032px of wall against architecture's 10,632px for forty, so the short
 * chapter reads as SELECTIVE rather than empty — the whole point of the rule (§4.3).
 *
 * The earlier constants (ideal 4.2 / minRows 5 / minTarget 2.15) were carrying the intent but not delivering
 * it: the greedy packer systematically undershot its target, so the two chapters rendered at 394px against
 * 455px — a 15% difference, which is not a legible distinction. The rule was true in the code and invisible
 * on the page. These constants are set so that the SHORT chapter grows rather than the long one shrinking:
 * architecture's median frame went 394px → 432px in the same change, because "make the contrast visible"
 * must never be read as "make the photographs smaller" (priority 1).
 *
 * MAX_TARGET is the "minimum legible size" floor of §4.3: past it the rule stops tightening and the chapter
 * simply CONTINUES (more rows), rather than shrinking photographs into postage stamps. That makes "never
 * empty, never too full" a structural guarantee at ANY count and ANY category ratio — no redesign, no
 * per-chapter hand-tuning. Curation remains the scale valve (§17.3), exactly as blueprint 8.35 intends.
 * ------------------------------------------------------------------ */
const WALL = {
	/** Comfortable summed-AR per row once a chapter is large enough to set its own density. */
	ideal: 3.2,
	/** Every chapter receives at least this much wall, however few photographs it holds. */
	minRows: 6,
	/** Sparsest permitted row — the largest a photograph is ever hung in the index. */
	minTarget: 1.75,
	/** Densest permitted row — the minimum legible size. The floor of the rule (§4.3). */
	maxTarget: 5.4,
	/** A featured work takes more wall: its row targets this fraction of the chapter's density. */
	featureFactor: 0.72,
	/** A row of only quiet works may pack tighter. */
	quietFactor: 1.2,
} as const;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** The chapter's own density, derived from what actually hangs in it. */
function wallTarget<T extends Tile>(items: T[]): number {
	const totalAr = items.reduce((n, t) => n + packAr(t.ar), 0);
	if (!totalAr) return WALL.ideal;
	const rows = Math.max(WALL.minRows, Math.round(totalAr / WALL.ideal));
	return clamp(totalAr / rows, WALL.minTarget, WALL.maxTarget);
}

/**
 * Greedy justified-row packer, driven by the chapter's allocated density.
 *
 * Curatorial scale is made VISIBLE here (§4.4): the row a `feature` opens targets a lower summed AR, so a
 * featured work is hung larger and with fewer companions; a row of only `quiet` works packs tighter. Wide
 * `feature` tiles are lifted out entirely as full-width anchors, spaced so the big moments punctuate rather
 * than clump. Authored hierarchy, no new data model, no per-chapter tuning.
 */
function justify<T extends Tile & { scale?: WorkTile['scale'] }>(
	items: T[],
	opts: { target?: number; anchor?: (t: T) => boolean; minGap?: number } = {},
): MediaNode<T>[] {
	const base = opts.target ?? wallTarget(items);
	const isAnchor = opts.anchor ?? (() => false);
	const minGap = opts.minGap ?? 3;

	const nodes: MediaNode<T>[] = [];
	let buf: T[] = [];
	let bufAr = 0;
	let rowTarget = base;
	let sinceAnchor = minGap; // allow an anchor immediately if the first item qualifies

	/*
	 * The row's target is fixed by the work that OPENS it, and never re-derived afterwards.
	 *
	 * It used to be recomputed from whatever was currently in the row, which meant a feature arriving as the
	 * second or third item retroactively moved the goal below the sum already accumulated — closing the row
	 * instantly. Combined with the greedy overshoot guard below, that is what made architecture's rendered
	 * row sums scatter across 1.5 → 5.17 inside a single chapter: adjacent rows differing more than
	 * threefold in height for reasons that have nothing to do with curation. A visitor reads that as
	 * arbitrary, which is the exact opposite of §4.4 — the curator's judgement made VISIBLE.
	 *
	 * Deciding at the opener is also what the rule already says in words: "the row a `feature` opens targets
	 * a lower summed AR".
	 */
	const targetForOpener = (t: T) => {
		if (t.scale === 'feature') return base * WALL.featureFactor;
		if (t.scale === 'quiet') return base * WALL.quietFactor;
		return base;
	};

	const flush = () => {
		if (buf.length) {
			nodes.push({ type: 'row', items: buf });
			buf = [];
			bufAr = 0;
		}
	};

	for (const it of items) {
		/*
		 * An anchor may interrupt an open row only once that row is substantially built. Taking one the
		 * instant it qualified flushed whatever had accumulated, leaving stub rows (a single frame summing
		 * 1.5 against a target of 3.2) standing directly beside a full-width anchor — two big beats
		 * colliding. Requiring a completely empty row instead went too far the other way and starved the
		 * chapter of anchors altogether (3 → 1 in the render), losing the punctuation §4.4 depends on. The
		 * threshold keeps both: the big moments survive, and none of them truncates a half-built row.
		 */
		// A frame wider than a row can carry always takes the full width, whatever the curator's scale and
		// whatever the anchor spacing says — it is a geometric fact about the photograph, not a curatorial
		// choice, and the alternative is the 159px sliver described on `arOf`.
		const mustAnchor = it.ar > AR_ROW_MAX;
		if (mustAnchor || (isAnchor(it) && sinceAnchor >= minGap && (!buf.length || bufAr >= rowTarget * 0.6))) {
			flush();
			nodes.push({ type: 'anchor', item: it });
			sinceAnchor = 0;
			continue;
		}
		if (!buf.length) rowTarget = targetForOpener(it);
		const a = packAr(it.ar);
		buf.push(it);
		bufAr += a;
		sinceAnchor++;

		/*
		 * Close at whichever break lands NEAREST the target, rather than at the first item that crosses it.
		 * The greedy rule closed as soon as the sum reached the target and separately bailed out early when
		 * a wide frame threatened to overshoot, so rows systematically undershot and the leftovers were then
		 * folded onto whatever row preceded them — the two ends of the 1.5/5.17 scatter. Comparing the error
		 * on both sides of the current item is the standard justified-layout decision and it keeps every row
		 * clustered around the chapter's allocated density, which is what makes the Wall Allocation Rule
		 * legible as a rule instead of as noise.
		 */
		if (bufAr >= rowTarget) {
			const errWith = bufAr - rowTarget;
			const errWithout = rowTarget - (bufAr - a);
			if (buf.length > 1 && errWithout < errWith) {
				buf.pop();
				bufAr -= a;
				flush();
				rowTarget = targetForOpener(it);
				buf.push(it);
				bufAr = a;
			} else {
				flush();
			}
		}
	}

	// Trailing remainder: fold a too-thin last row back into the previous row so no lone frame is left to
	// stretch to a full-width (tall) beat. If the previous node is an anchor, keep it as its own contained
	// row (CSS caps a solo row's width so it stays a calm centred single, never a giant).
	if (buf.length) {
		const last = nodes[nodes.length - 1];
		if (bufAr < base * 0.6 && last && last.type === 'row') last.items.push(...buf);
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
	// A project gallery is short, so it is hung generously (2-up rhythm) and its panos become anchors with
	// no spacing constraint — a short gallery earns its big moment.
	return justify(tiles, { target: 3.2, anchor: (t) => t.orientation === 'pano', minGap: 0 });
}

function toWorkTile(w: CollectionEntry<'works'>): WorkTile {
	return {
		id: w.id,
		image: w.data.image,
		alt: w.data.alt,
		caption: w.data.caption,
		category: w.data.category,
		scale: w.data.scale,
		overture: w.data.overture,
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
	/**
	 * The near-plane cycling group. Grouping follows the wall (§10.5): a photograph opened in Architectuur
	 * cycles through Architectuur and can never fall out of one discipline into another. This is also why
	 * the counter reads "12 / 40" — the position is stated within the group, not the site.
	 */
	group: string;
}

export interface Overview {
	projects: CollectionEntry<'projects'>[];
	chapters: OverviewChapter[];
	/** The overture photograph (§3.1) — the poster of the exhibition, curator-designated. */
	overture: WorkTile;
	total: number; // distinct photographs discoverable through the whole overview (works + project images)
	workCount: number;
	seriesCount: number;
	seriesImageCount: number;
}

/* ------------------------------------------------------------------ *
 * HET CONTINUÜM — the flat field (supersedes the chaptered overview for `/portfolio/`).
 *
 * The justified packer above exists to answer "how much wall does this chapter get, and how do its
 * photographs divide it?" — a question that only has meaning when a photograph has ONE size. In the
 * continuum a photograph's size is a continuous function of attention, so allocation, row density,
 * anchors and the whole Wall Allocation Rule have nothing to decide. What the field needs instead is
 * a single ordered list of everything, and an order chosen for RHYTHM (blueprint 8.34).
 *
 * `justify()` / `getOverview()` are retained because the project-detail beeldreeks still uses them.
 * ------------------------------------------------------------------ */
export interface FieldItem {
	id: string;
	kind: 'work' | 'project';
	category: 'architectuur' | 'interieur' | 'projecten';
	label: string;
	image: ImageMetadata;
	alt: string;
	caption?: string;
	/** Where the item goes when activated. Works open the lightbox; a series goes to its own page. */
	href?: string;
	ar: number;
}

/**
 * THE THREE WORLDS — Projecten, Architectuur, Interieur (Phase 3, D-73).
 *
 * The traverse is one continuous coil, but the visitor travels it as three CONTIGUOUS worlds in a fixed
 * authored order (Experience Architecture §4.1). De-interleaving the two disciplines — D-72 mixed them into
 * one stream — is what turns each into a WORLD you ENTER rather than a label under scattered frames: the
 * felt "je komt een nieuwe wereld binnen" the owner asked for. The boundary between two worlds is a
 * gradient, not a cut (§4.2): the wayfinding text changes and the ambient light eases from cool
 * (architecture) to warm (interior); nothing gates the visitor and the coil never breaks.
 *
 * The order is authored, not incidental (§4.1): Projecten first (a complete commission is the strongest
 * proof of capability), Architectuur before Interieur (the primary specialisation and the larger body, and
 * the cool→warm light descent the homepage established), interior last (warm, close — the right handoff
 * into contact). The prior interleave rationale (surfacing the 7 interiors early) is answered instead by
 * the wayfinding jump (§5.2): the visitor reaches any world from anywhere without scrolling the whole coil.
 *
 * The copy is deliberately minimal — roughly the old portfolio's amount (a line plus three names),
 * integrated into the journey rather than set as a banner (owner, Phase 3). It is descriptive and factual,
 * never a marketing claim (CLAUDE §4.6).
 */
export type WorldId = 'projecten' | 'architectuur' | 'interieur';

export interface PortfolioWorld {
	id: WorldId;
	label: string;
	/** A short, factual descriptor of the world's subject — brand identity, quietly present. */
	sub: string;
	/** Index of the world's first item in `items`, and how many items the world holds. */
	start: number;
	count: number;
	/** The `work-<id>` of the world's first item, so a jump is a real in-page anchor even without JS. */
	anchorId: string;
}

const WORLD_META: Record<WorldId, { label: string; sub: string }> = {
	projecten: { label: 'Projecten', sub: 'Complete opdrachten, als geheel' },
	architectuur: { label: 'Architectuur', sub: 'Gebouwen, lijn en licht' },
	interieur: { label: 'Interieur', sub: 'Ruimte, materiaal en sfeer' },
};

export async function getContinuum(): Promise<{
	items: FieldItem[];
	worlds: PortfolioWorld[];
	counts: { alles: number; architectuur: number; interieur: number; projecten: number };
}> {
	const works = await getCollection('works');
	const projects = (await getCollection('projects', ({ data }) => !data.draft)).sort(
		(a, b) => a.data.order - b.data.order,
	);

	const tiles = works.map(toWorkTile);
	const toField = (t: WorkTile): FieldItem => ({
		id: t.id,
		kind: 'work',
		category: t.category,
		label: t.category === 'architectuur' ? 'Architectuur' : 'Interieur',
		image: t.image,
		alt: t.alt,
		caption: t.caption,
		ar: t.ar,
	});

	const arch = tiles.filter((t) => t.category === 'architectuur').map(toField);
	const inter = tiles.filter((t) => t.category === 'interieur').map(toField);

	const series: FieldItem[] = projects.map((p) => ({
		id: p.id,
		kind: 'project',
		category: 'projecten',
		label: `Reeks · ${p.data.gallery.length + 1} beelden`,
		image: p.data.coverImage,
		alt: p.data.coverImageAlt,
		caption: p.data.title,
		href: `/portfolio/${p.id}/`,
		ar: arOf(p.data.coverImage),
	}));

	/* THREE CONTIGUOUS WORLDS, in authored order (D-73, supersedes D-72's single interleaved stream).
	   Each world is one unbroken stretch of the coil, so the visitor genuinely enters it and the wayfinding
	   + ambient light can name and colour exactly where they are. A world with no work is not emitted, so
	   the structure holds at any collection ratio and if a discipline is ever empty (scalability §17.4). */
	const groups: { id: WorldId; list: FieldItem[] }[] = (
		[
			{ id: 'projecten', list: series },
			{ id: 'architectuur', list: arch },
			{ id: 'interieur', list: inter },
		] as { id: WorldId; list: FieldItem[] }[]
	).filter((g) => g.list.length > 0);

	const items: FieldItem[] = [];
	const worlds: PortfolioWorld[] = [];
	for (const g of groups) {
		const start = items.length;
		items.push(...g.list);
		worlds.push({
			id: g.id,
			label: WORLD_META[g.id].label,
			sub: WORLD_META[g.id].sub,
			start,
			count: g.list.length,
			anchorId: `work-${g.list[0].id}`,
		});
	}

	return {
		items,
		worlds,
		counts: {
			alles: items.length,
			architectuur: arch.length,
			interieur: inter.length,
			projecten: series.length,
		},
	};
}

export async function getOverview(): Promise<Overview> {
	const works = await getCollection('works');
	const projects = (await getCollection('projects', ({ data }) => !data.draft)).sort(
		(a, b) => a.data.order - b.data.order,
	);

	const tiles = works.map(toWorkTile);
	const arch = tiles.filter((t) => t.category === 'architectuur');
	const inter = tiles.filter((t) => t.category === 'interieur');

	// A wide `feature` frame earns a full-width anchor. Spacing is DERIVED from the chapter's size (a rule,
	// not an arrangement — §17) so a small chapter is never over-punctuated and a large one never clumps.
	const wideFeature = (t: WorkTile) => t.scale === 'feature' && t.ar > 1.6;
	const anchorGap = (n: number) => Math.max(3, Math.round(n / 6));

	const chapter = (id: OverviewChapter['id'], label: string, tiles: WorkTile[]): OverviewChapter => ({
		id,
		label,
		count: tiles.length,
		group: `pf-${id}`,
		nodes: justify(tiles, { anchor: wideFeature, minGap: anchorGap(tiles.length) }),
	});

	const chapters: OverviewChapter[] = [
		chapter('architectuur', 'Architectuur', arch),
		chapter('interieur', 'Interieur', inter),
	];

	// The overture (§3.1): the one photograph the page opens with. Curator-designated via the `overture`
	// flag in works.json, with a sane default — the first feature-scale work in curatorial order — so the
	// page always has a considered opening even before anyone sets the flag (§20).
	const overture = tiles.find((t) => t.overture) ?? tiles.find((t) => t.scale === 'feature') ?? tiles[0];

	const seriesImageCount = projects.reduce((n, p) => n + 1 + p.data.gallery.length, 0);

	return {
		projects,
		chapters,
		overture,
		total: works.length + seriesImageCount,
		workCount: works.length,
		seriesCount: projects.length,
		seriesImageCount,
	};
}
