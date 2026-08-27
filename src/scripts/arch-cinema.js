/*
 * arch-cinema.js — `/diensten/architectuurfotografie/`. THE TILT, and THE TURN.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────
 * THE FILM (§10's three questions, answered from THIS page's photographs and from nowhere else).
 *
 *   SENTENCE — "You are standing in a city under a big weather sky. You look out across it; you tip your
 *               head back, and then you turn it: two buildings stand side by side in front of you and you
 *               look from one to the other. Then you come back down, past the work, to the ground."
 *
 *   THE HOUR — BLUE HOUR, deepening into nocturne (P8.5 / D-76; was DAYLIGHT going to sunset). The
 *               original hour was read off this page's own three photographs — all bright exterior
 *               daylight, the last a magenta sunset — and that reading was sound under §11.2 ("the hour is
 *               a function of the photographs on the page"). It is superseded by a current explicit owner
 *               instruction to remove the purple and bring this page fully inside the site's identity,
 *               which outranks it (CLAUDE §3.1.1). What is kept is the reason the hour exists: the sky
 *               still MOVES through a time of day across the page's length, and it still lands, at the
 *               CTA, on the same deep sapphire the CTA and footer are made of.
 *
 *   MECHANISM — THE TILT (the page) and THE TURN (the spread inside it). Read off the frames: Rotterdam is
 *               shot FROM height looking OUT, the Amersfoort spire looking UP, the Arnhem towers looking
 *               STRAIGHT UP. So the page's camera tips its head back over its length — the horizon sinks,
 *               the zenith opens, the air falls past and thins.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────
 * P8.3 — WHAT CHANGED, AND WHY IT IS NOT A TWEAK.
 *
 * The two representative photographs used to be two consecutive 100svh scenes with an arrival each. That
 * was ~2.5 screens of page spent on photography before anything else was given a frame, and it is the
 * reason everything after them read as ordinary webpage content: not because the later beats were
 * undirected, but because the photography had already consumed the film's whole budget of attention.
 *
 * They are now ONE EDITORIAL SPREAD — side by side, sharing a baseline, deliberately smaller — and the
 * camera does not scroll down them. It TURNS ITS HEAD ACROSS THEM.
 *
 * HOW THE TURN IS BUILT, AND WHY THE PHOTOGRAPH IS PROVABLY UNDAMAGED.
 *   The rail carries `translateX(sweep) rotateY(θ)` under a perspective. Rotating the rail swings the two
 *   plates on an ARC around the reader: the one you are turning toward gains +z (it comes nearer, so
 *   perspective makes it larger), the other loses z (it recedes and shrinks). That is the depth signature
 *   of a head turning, and it is what a lateral slide can never produce.
 *
 *   Each plate then carries `rotateY(-θ)` — the exact inverse. So every photograph's plane stays PARALLEL
 *   to the screen at every scroll position, and a plane parallel to the projection plane cannot keystone:
 *   the perspective can only scale it UNIFORMLY. The image is never sheared, stretched, cropped, masked or
 *   foreshortened. This is a geometric guarantee, not a tuning — and it is measured on the render anyway
 *   (aspect-ratio error per plate, at every sampled angle).
 *
 *   The sky behind sweeps a FRACTION of the rail's lateral travel. Near things travel, far things barely
 *   do; that ratio is what tells the reader they moved rather than that the page moved.
 *
 *   And the attention follows the gaze, which is the point of the whole beat: the plate the head is
 *   pointed at is at full scale, fully lit and its caption fully legible; the other falls into the
 *   periphery — a little smaller, in shadow, its words quiet. The reader is directed ACROSS the
 *   composition rather than shown two things at once.
 *
 * WHY IT IS NOT THE HOMEPAGE AND NOT `/diensten/` (§11.1 / §11.3 — one mechanism per page).
 *   The homepage DESCENDS through hours. `/diensten/` TRAVERSES sideways between two dark rooms.
 *   `/interieurfotografie/` WALKS FORWARD through enclosed space. This page CLIMBS, TILTS and TURNS.
 *   Shared, deliberately: the fixed `.stage` world (opacity/transform only), scrub weight, native scroll,
 *   pin discipline, `power2.out` arrivals, light-is-narrative, and the honest baseline.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────
 * CLIP-SAFETY — THE ABSOLUTE RULE, SOLVED BACKWARDS FROM THE TRAVEL.
 *
 * The plates are sized from what is LEFT after the turn's worst excursion and a safety margin have been
 * subtracted from the free width, so the amplitude can never grow into the margin. Everything is computed
 * in PIXELS from the measured layout. Only `opacity` and `transform` are written per frame.
 *
 * PROGRESSIVE ENHANCEMENT (§P13). Arms only under `prefers-reduced-motion: no-preference`. Under reduce or
 * no-JS `motion-scene` is never set, the stage stays invisible, and the page renders as its calm static
 * spread with both photographs complete, all copy present and every link real.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrubFor, COARSE_QUERY } from './scroll-weight.js';
import { clamp01, lerp, smoothstep } from './motion-math.js';

/** A 0..1 ramp between two altitudes, eased so it settles rather than tracking linearly. */
const ramp = (v, a, b) => smoothstep(clamp01((v - a) / (b - a)));
const DEG = Math.PI / 180;

export function initArchCinema() {
	if (typeof window === 'undefined' || !window.matchMedia) return;
	const docEl = document.documentElement;
	const stage = document.querySelector('.stage');
	if (!stage) return;

	const zenith = stage.querySelector('.stage__zenith');
	const dusk = stage.querySelector('.stage__dusk');
	const horizon = stage.querySelector('.stage__horizon');
	// P8.6 (D-77): the two `.stage__air` strata are gone (see the page's CSS for why a wide flat band is
	// still an object). One featureless `.stage__lift` carries the same motion.
	const lift = stage.querySelector('.stage__lift');
	const vig = stage.querySelector('.stage__vignette');
	if (!zenith || !dusk || !horizon || !lift || !vig) return;

	const spread = document.querySelector('.spread');
	const rail = spread && spread.querySelector('.spread__rail');
	const pair = spread && spread.querySelector('.spread__pair');
	const head = spread && spread.querySelector('.spread__head');
	if (!spread || !rail || !pair) return;

	const plates = ['l', 'r']
		.map((k) => {
			const el = pair.querySelector('.plate--' + k);
			if (!el) return null;
			return {
				key: k,
				el,
				frame: el.querySelector('.plate__frame'),
				shade: el.querySelector('.plate__shade'),
				copy: el.querySelector('.plate__copy'),
				natW: +el.dataset.w || 1700,
				natH: +el.dataset.h || 1133,
			};
		})
		.filter((p) => p && p.frame);
	if (plates.length < 2) return;

	// The beats after the spread. They are part of the film, not a tail appended to it.
	const scopeSec = document.querySelector('.svc-scope-sec');
	const relSec = document.querySelector('.rel');
	const ctaSec = document.querySelector('.cta');

	const mm = gsap.matchMedia();

	mm.add(
		{
			motion: '(prefers-reduced-motion: no-preference)',
			desktop: '(min-width: 52.0625rem)',
			/* P14: touch is a first-class input, not a narrow screen. Declared as a matchMedia CONDITION
			   rather than read once at build time so GSAP tears this context down and rebuilds it if the
			   primary input ever changes (a tablet gaining a trackpad) — the same guarantee `motion` and
			   `desktop` already have. See src/scripts/scroll-weight.js. */
			coarse: COARSE_QUERY,
		},
		(ctx) => {
			const { motion, desktop, coarse } = ctx.conditions;
			// Reduced motion: build nothing at all. The honest static composition is the render.
			if (!motion) {
				docEl.classList.remove('motion-scene');
				return;
			}

			gsap.registerPlugin(ScrollTrigger);

			// Amplitude scaling — gentler on mobile (blueprint 7.127–7.129). Mobile is a COMPLETE experience,
			// not a reduced desktop fallback: the sky still climbs, the air still falls past, the photographs are
			// still full width and both captions are still there. What it drops is the pin (§9.4 / §7.6).
			const A = desktop ? 1 : 0.6;

			let vw = docEl.clientWidth; // layout width — never innerWidth, which counts the scrollbar.
			let vh = window.innerHeight;
			let maxScroll = Math.max(1, docEl.scrollHeight - vh);

			/* ── THE SPREAD'S GEOMETRY, SOLVED BACKWARDS FROM THE TURN ────────────────────────────────
			   The plates are sized to a HEIGHT budget first (they must be smaller than they were — that is
			   the point of this pass), and the turn's amplitude is then solved from whatever free width the
			   resulting composition leaves. So the excursion is a consequence of the layout, never a
			   constant hoping the layout will accommodate it.

			   `share` is each plate's ceiling as a fraction of the rail. The two are deliberately unequal:
			   one photograph is portrait and the other landscape, and an even split makes the tall frame
			   tower over the wide one — an editorial spread has a lead image and a second, not two equals. */
			/* `heightCap` is a fraction of the room that is ACTUALLY left after the section head and the
			   captions have been paid for — not of the raw viewport. The lead frame takes nearly all of it
			   and the second sits lower, which is what makes them read as a lead and a second rather than
			   as two items in a row. */
			const PLATE = {
				l: { share: 0.34, heightCap: 0.94 },
				r: { share: 0.58, heightCap: 0.74 },
			};
			const TURN_DEG = desktop ? 10 : 0; // the head's half-angle. No 3D below the pin threshold.
			const PERSPECTIVE = 1150;
			/* The lateral sweep is deliberately SMALLER than the depth change. A large sweep starts to read
			   as the composition sliding across a page — the carousel reading this beat exists to avoid —
			   because the space it vacates on one side is empty sky, and empty sky arriving does not look
			   like new world coming into view. The head turn is carried by DEPTH (one plate approaching
			   while the other recedes), by LIGHT, and by the sky's much slower pan behind it. The sweep is
			   only there to keep the whole field moving so no frame is ever frozen. */
			const SWEEP_MAX = 66;
			const SAFE = 26;
			/* ── THE TRAVERSE (P8.6 / D-77) ───────────────────────────────────────────────────────────
			   THE COMPLAINT, AND WHY IT IS ABOUT AXES RATHER THAN ABOUT SPEED. "De huidige fotobeweging
			   voelt onnatuurlijk. Nu: verticaal → ineens horizontaal." That is a literal description of what
			   the beat did: the reader is travelling DOWN, the pin arrests the page's vertical travel
			   completely, and every pixel of movement that follows is LATERAL (`pan` on the pair, a rotation
			   about a vertical axis). Two axes, handed over between in one frame. No easing curve can fix
			   that, because the discontinuity is not in the speed — it is in the direction.

			   SO EVERY MOVING THING IN THE BEAT NOW TRAVELS ON A STRAIGHT DIAGONAL, and the vertical
			   component never stops and never reverses. The owner's own example is followed exactly:
			     photo A (the lead, left)  travels top-left  → bottom-right;
			     photo B (the second, right) travels top-right → bottom-left.
			   They are mirrored, monotone, and simultaneous — "daarna" is carried by the ATTENTION handover
			   (light + depth), not by one photograph stopping so the other can start. A movement that stops
			   and restarts is the thing being complained about.

			   The amplitudes are charged to the layout BEFORE the movement exists, exactly as the sweep
			   already was: `DIAG_Y` is subtracted from the height budget in layoutSpread(), and the lateral
			   half-amplitude is clamped both to the free margin at the viewport edges AND to a quarter of the
			   gap between the two plates, so the two can never converge into each other. The photograph is
			   still never cropped, masked or keystoned: these are screen-parallel translations applied inside
			   each plate's counter-rotated space, which is the same geometry that already guaranteed it. */
			const DIAG_Y = desktop ? 30 : 0; // vertical half-amplitude, px — paid for out of the height budget.
			const MIN_GAP = 52; // air the two plates must keep at their closest, px.

			let sweep = 0; // resolved every refresh from the free width the composition actually leaves.
			let diagX = 0; // per-plate lateral half-amplitude, resolved with it.

			function layoutSpread() {
				/* THE HEIGHT BUDGET IS THE WHOLE SCENE, NOT JUST THE PICTURES. The plates share the pinned
				   viewport with the section head above them and their own captions below, and sizing them
				   against the raw viewport height is exactly how the previous pass ended up crowded: every
				   pixel the head and the captions needed was taken out of the air around the photographs.
				   Measure what the copy actually occupies at this viewport, subtract it, and let the
				   photographs have a generous share of what genuinely remains. */
				let chrome = 0;
				if (desktop) {
					if (head) chrome += head.getBoundingClientRect().height + 56;
					let capH = 0;
					for (const p of plates) if (p.copy) capH = Math.max(capH, p.copy.getBoundingClientRect().height);
					chrome += capH;
				}
				/* 150px of air that the photographs are NOT allowed to spend. Measured: at 96 the lead frame's
				   caption landed 11px from the bottom of the viewport — technically inside it, and visibly
				   crammed against the edge. The margin is a composition decision, so it is a constant here
				   rather than whatever happens to be left over. */
				/* P8.6 (D-77): the diagonal's vertical excursion is charged here, before the photographs are
				   sized — 2 × DIAG_Y, because the scene rides that far above the designed position at the
				   start of the beat and that far below it at the end. Sizing first and moving afterwards is
				   how "the numbers were fine and the render clipped" happens. */
				const room = Math.max(240, vh - chrome - 150 - 2 * DIAG_Y);

				for (const p of plates) {
					const cfg = PLATE[p.key];
					const byHeight = room * cfg.heightCap * (p.natW / p.natH);
					const railW = rail.clientWidth || vw;
					// Never above native width: no upscale, ever (the 1700px source ceiling is arithmetic,
					// not a preference — it decides which compositions exist at all).
					const w = Math.round(Math.min(byHeight, railW * cfg.share, p.natW));
					p.el.style.setProperty('--plate-w', w + 'px');
					p.h = w / (p.natW / p.natH);
				}
				/* THE STEP. A portrait frame and a landscape frame cannot share a baseline without one of
				   them being starved, which is what made the old composition feel compressed. They are
				   top-aligned instead, with the shorter frame dropped so the two OPTICAL CENTRES agree:
				   a relaxed editorial step, and the reason the gold datum that used to tie them together
				   is no longer needed by the composition at all. */
				const tallest = Math.max(...plates.map((p) => p.h || 0));
				for (const p of plates) {
					const drop = desktop ? Math.round(Math.max(0, (tallest - (p.h || 0)) * 0.5)) : 0;
					p.el.style.setProperty('--plate-drop', drop + 'px');
				}

				if (!desktop) {
					sweep = 0;
					diagX = 0;
					return;
				}
				// Measure what the composition actually occupies, then spend the leftover on the turn.
				const railRect = pair.getBoundingClientRect();
				const cx = railRect.left + railRect.width / 2;
				let halfContent = 0;
				for (const p of plates) {
					const r = p.el.getBoundingClientRect();
					p.x0 = r.left + r.width / 2 - cx;
					halfContent = Math.max(halfContent, Math.abs(p.x0) + r.width / 2);
				}
				/* THE MARGIN IS SPENT BEFORE THE MOVEMENT EXISTS. The rotation pushes the nearer plate
				   outward by the perspective's own scale factor, so that growth is charged here too — it is
				   the term that is easy to forget and it is exactly how "the numbers were fine and the
				   render clipped" happens on this project. */
				const grow = halfContent * (PERSPECTIVE / (PERSPECTIVE - halfContent * Math.sin(TURN_DEG * DEG)) - 1);
				const free = vw / 2 - halfContent - grow - SAFE;
				sweep = Math.max(0, Math.min(SWEEP_MAX, free));

				/* THE DIAGONAL'S LATERAL HALF-AMPLITUDE (P8.6 / D-77). Two independent ceilings, both of
				   which must hold, because the two plates travel in OPPOSITE directions:
				     · the free margin at the viewport edges — each plate swings `diagX` outward at one end
				       of the beat, so it is charged against exactly the budget `sweep` was;
				     · a quarter of the gap BETWEEN the plates — they converge by 2 × diagX at the other end,
				       so this keeps at least half the designed gap at the closest moment. Nothing in the
				       old `free` calculation covered this, because the pair used to move as one and the gap
				       never changed. */
				/* THE GAP MUST BE READ FROM LAYOUT, NOT FROM THE RENDER. A first cut measured it with
				   `getBoundingClientRect()`, which INCLUDES the transforms — so on every refresh after the
				   first it read the gap the diagonal had just opened (68px designed, 137px observed) and
				   licensed an amplitude twice what the composition had room for. Measured consequence: the
				   two plates closed to 4.5px of each other at the end of the beat — visually touching.
				   `offsetLeft`/`offsetWidth` are layout boxes and ignore transforms entirely, so the clamp
				   can no longer read a number it created itself.
				   MIN_GAP is then the air the composition must keep at the CLOSEST moment, and the depth
				   term is charged on top of it: the attended plate also grows (scale 0.96 → 1.00 plus the
				   perspective's own gain at translateZ +20), which closes the gap by a further ~10px that no
				   lateral calculation would ever see. */
				const pl = plates.find((p) => p.key === 'l').el;
				const pr = plates.find((p) => p.key === 'r').el;
				const gapFree = Math.max(
					0,
					Math.max(
						pr.offsetLeft - (pl.offsetLeft + pl.offsetWidth),
						pl.offsetLeft - (pr.offsetLeft + pr.offsetWidth)
					)
				);
				diagX = Math.max(0, Math.min(sweep * 0.62, (gapFree - MIN_GAP) / 2));
			}

			/* ── THE SUMMIT IS A PLACE ON THE PAGE, NOT THE END OF IT ─────────────────────────────────
			   `peak` is where the spread releases its pin: the altitude arc turns around there rather than
			   at the end of the document. Measured from the trigger, never from an offsetTop, because
			   pinning changes offsets and a measured constant drifts the moment copy reflows. */
			let peak = 0;
			function refreshMetrics() {
				vw = docEl.clientWidth;
				vh = window.innerHeight;
				maxScroll = Math.max(1, docEl.scrollHeight - vh);
				layoutSpread();
				peak = spreadST ? spreadST.end : spread.getBoundingClientRect().bottom + window.scrollY;
				peak = Math.min(Math.max(peak, vh), maxScroll - 1);
			}

			/* How much of the viewport a beat currently owns. Tolerant of tall blocks: a section taller than
			   the viewport counts as fully near while you are anywhere inside it, which a centre-distance
			   measure would not do. Read LIVE off geometry, so it survives pinning and reverses for free. */
			function near(el) {
				if (!el) return 0;
				const b = el.getBoundingClientRect();
				const top = Math.max(0, b.top);
				const bottom = Math.min(vh, b.bottom);
				return clamp01((bottom - top) / Math.min(vh, Math.max(1, b.height)));
			}

			/* ── THE HEAD ANGLE ───────────────────────────────────────────────────────────────────────
			   `turn` runs 0 (looking at the LEFT plate) → 1 (looking at the RIGHT plate). It is the pinned
			   scene's own progress, shaped so the head DWELLS at each end and moves between them: you
			   arrive, you settle, you look across, you settle. A linear sweep would read as a mechanism;
			   an eased one with real dwell at both ends reads as looking. */
			let turn = 0;
			let spreadST = null;
			/* P8.5 (D-76) — A LONGER DWELL AND A FASTER LOOK. The owner's note on this beat is that both
			   photographs hold your attention at the same time and it never reads as "first this one, then
			   that one". Two things caused it, and the first is here: the old window (0.22 → 0.78) gave each
			   plate only ~22% of the scene alone and spent 56% of it mid-turn — i.e. for most of the beat the
			   head was pointed BETWEEN the two photographs, which is exactly the state in which neither is
			   the subject. The scene is now three roughly equal acts: A alone (0 → 0.32), the look across
			   (0.32 → 0.68), B alone (0.68 → 1). That is how the move gets to be a move — it needs something
			   settled on either side of it. Same easing family, same geometry, one window. */
			const gaze = (t) => smoothstep(clamp01((t - 0.32) / 0.36));

			/* Each beat's own light, read LIVE off the spread's position in the viewport — robust against
			   pinning, which reports a stable rect while you stand inside it. */
			function spreadNear() {
				const b = rail.getBoundingClientRect();
				const dist = Math.abs(b.top + b.height / 2 - vh / 2);
				return clamp01(1 - Math.max(0, dist - vh * 0.15) / (vh * 0.85));
			}

			/* ── THE SKY (one update, every frame) ────────────────────────────────────────────────────
			   TWO PROGRESSIONS, NOT ONE — and separating them is what directs the whole back half of this
			   page without adding a single new moving element (§15.5: a page's progression variable is a
			   dramatic choice, not a scroll mapping).

			     · `alt`  — ALTITUDE, an ARC. 0 in the street, 1.0 at the spread, and then back DOWN to a low
			                ridge by the closing CTA. You climbed; now you descend. The horizon that sank out
			                of frame on the way up RETURNS on the way down.
			     · `hour` — TIME, MONOTONE. Blue hour → dusk → nocturne, and it never runs backwards, because that is
			                not something an evening does. The two curves crossing is what makes the descent
			                read as evening rather than as rewind. */
			function update() {
				const t = gsap.ticker.time;
				const y = window.scrollY;
				const alt =
					y <= peak
						? smoothstep(clamp01(y / peak))
						: lerp(1, 0.24, smoothstep(clamp01((y - peak) / Math.max(1, maxScroll - peak))));
				const hour = clamp01(y / maxScroll);
				/* THE DESCENT'S OWN VARIABLE. `alt` is an arc, so it cannot tell the back half apart from
				   the front half — 0.6 on the way down looks identical to 0.6 on the way up, and anything
				   driven off it alone therefore RETRACES rather than continues. `down` runs 0→1 across the
				   whole stretch after the spread and never turns around, which is what lets the world keep
				   MOVING for the rest of the page instead of playing the climb backwards. */
				const down = y <= peak ? 0 : clamp01((y - peak) / Math.max(1, maxScroll - peak));
				const g = gaze(turn);
				const nSpread = spreadNear();
				const nScope = near(scopeSec);
				const nRel = near(relSec);
				const nEnd = near(ctaSec);

				// THE HORIZON SINKS. The ground-haze band you start level with drops out of the frame as you
				// climb — the clearest tell of altitude, and the exact inverse of the homepage's horizon
				// rising past a falling camera (§11.1: related, not copied).
				horizon.style.transform = 'translate3d(0,' + (alt * 58 * A).toFixed(2) + 'vh,0)';
				horizon.style.opacity = (0.95 * (1 - ramp(alt, 0.02, 0.62))).toFixed(3);

				/* THE AIR STILL FALLS PAST — IT JUST HAS NOTHING IN IT NOW (P8.6 / D-77).
				   The two strata that used to carry this term are gone; the owner reads any band with ends
				   as a cloud, and they are right (see the page's CSS). What survives is exactly the motion,
				   moved onto one featureless vertical ramp:
				     · it descends past the camera as `alt` rises — the sky brightening and then falling away
				       beneath you, which is the parallax of climbing without a single locatable shape;
				     · it goes on travelling through `down`, so the back half of the page is still a moving
				       world rather than a still photograph of one (§3.1.7);
				     · and it breathes on a slow sine, so the world is never metronomic.
				   The lateral sweep is deliberately NOT carried here any more. A horizontal term on a layer
				   whose gradient is vertical is a translation nobody can see, and the pinned beat's own
				   diagonal now carries the reader's movement (see THE TRAVERSE below). */
				const liftY = lerp(-26, 46, alt) * A + down * 16 * A + Math.sin(t * 0.06) * 1.1 * A;
				lift.style.transform = 'translate3d(0,' + liftY.toFixed(2) + 'vh,0)';
				// It thins as you rise above it, and keeps a residue to the end: at altitude there is always
				// thin high air, and it is what stops the last third of the page from going inert.
				lift.style.opacity = (0.86 * (0.22 + 0.78 * (1 - ramp(alt, 0.16, 0.86)))).toFixed(3);

				// THE ZENITH OPENS OVERHEAD as the head goes back, and blazes across the spread — the deep
				// blue the spire is photographed against, arriving as its own light rather than as a tint.
				zenith.style.opacity = clamp01(ramp(alt, 0.05, 0.56) * 0.58 + nSpread * 0.44).toFixed(3);

				// DUSK ARRIVES LAST (P8.5 / D-76 — was the Arnhem frame's magenta sunset, removed on the owner's
				// explicit instruction; see the CSS for why magenta-over-blue was the purple). It rides `hour`,
				// NOT `alt`: an evening does not un-happen because you walked back down the stairs. So it lifts
				// into the spread and goes on deepening across the whole descent, landing this page's sky in the
				// same nocturne blue as the CTA and footer it hands off to.
				dusk.style.opacity = clamp01(ramp(hour, 0.34, 0.82) * 0.62 + nSpread * g * 0.26).toFixed(3);

				/* THE FRAME BREATHES. The corners let go as you rise and CLOSE again as you come down — and
				   they close FURTHEST at the two beats whose whole carrier is enclosure: the specification
				   wall, where the reader is looking at one still composition, and the CTA, where the film
				   ends. Riding `alt` rather than `hour` is what makes the last third feel enclosed and calm
				   instead of merely dark: it is the descent, not the end of the file. */
				vig.style.opacity = clamp01(
					lerp(0.52, 0.17, ramp(alt, 0.05, 0.85)) + nScope * 0.1 + nRel * 0.05 + nEnd * 0.34
				).toFixed(3);
			}

			// Seed the world at the reader's current altitude and reveal it BEFORE flagging motion-scene, so
			// the static composition hands off onto an already-correct sky (never a flash of flat ink).
			docEl.classList.add('motion-scene');
			refreshMetrics();
			update();
			gsap.ticker.add(update);
			ScrollTrigger.addEventListener('refresh', refreshMetrics);

			/* ── THE TURN ─────────────────────────────────────────────────────────────────────────────
			   Applied from the same ticker as the sky, off one shared `turn` value, so the composition and
			   the world can never disagree by a frame. Every write is a transform or an opacity. */
			function applyTurn() {
				const g = gaze(turn);
				const theta = (1 - 2 * g) * TURN_DEG; // +TURN = looking left, −TURN = looking right.

				/* THE TRAVERSE (P8.6 / D-77). One number drives the whole diagonal: `trav` runs −1 → +1 once
				   across the beat and never turns around. It is smoothstepped on the RAW pinned progress,
				   not on `gaze`, for two reasons — it must be monotone (gaze is monotone too, but it is
				   shaped for the attention handover and holds still at both ends, which would freeze the
				   movement exactly where the pin engages and releases), and a smoothstep has zero velocity
				   at both ends, so the traverse eases IN as the pin takes hold and eases OUT as it lets go.
				   That is the "geen abrupte snelheidswisselingen" of brief item 9, solved at the source
				   rather than by choosing a different cubic-bezier. */
				const sp = turn * turn * (3 - 2 * turn);
				const trav = 2 * sp - 1;

				// Only the PAIR turns. The section head stays square to the screen and drifts the other way
				// on the same diagonal at a fraction of the travel — a far plane, so it reads as depth —
				// because rotating a text block through a perspective softens its glyphs, and a heading you
				// have to squint at is not premium.
				pair.style.transform = 'rotateY(' + theta.toFixed(3) + 'deg)';
				if (head)
					head.style.transform =
						'translate3d(' +
						(-trav * diagX * 0.26).toFixed(2) +
						'px,' +
						(trav * DIAG_Y * 0.34).toFixed(2) +
						'px,0)';

				/* THE HANDOVER CURVE (P8.5 / D-76 — the second cause). Attention used to be LINEAR in `g`, so
				   through the whole middle of the turn both plates sat at ~0.5 of the treatment: a tie, held
				   for as long as the turn lasted. A second smoothstep makes attention flat at each end and
				   steep through the crossing (slope 2.25 at the midpoint vs 1.0), so the moment where the two
				   are equal is passed through rather than dwelt in. It is a handover, not a dissolve. */
				const gg = g * g * (3 - 2 * g);
				for (const p of plates) {
					const look = p.key === 'l' ? 1 - gg : gg;
					/* DEPTH. The unattended plate physically RECEDES — 60px away from the camera and a 4%
					   uniform shrink — while the attended one comes 20px forward. Both terms live inside the
					   plate's own counter-rotated space, which is parallel to the screen, so translateZ moves
					   along the view axis and scale is uniform: neither can keystone or crop the photograph.
					   The no-damage guarantee is unchanged, by the same geometry as the counter-rotation.
					   The exact inverse rotation stays leftmost so it is applied last, in the pair's space. */
					const zPush = -60 * (1 - look) + 20 * look;
					const s = 1 - 0.04 * (1 - look);
					/* THE MIRRORED DIAGONALS (P8.6 / D-77) — the owner's example, literally. The lead plate
					   (`l`) runs top-left → bottom-right; the second (`r`) runs top-right → bottom-left. Both
					   descend, so the beat never contradicts the direction the reader is scrolling, and
					   neither ever moves purely sideways.
					   The translate is placed AFTER the counter-rotation in the transform list, which means it
					   is applied in the plate's own counter-rotated space — and that space is parallel to the
					   screen by construction (the pair rotates by θ, the plate by −θ). So this is a pure
					   screen-space slide: it cannot keystone, crop or clip the photograph, by the same
					   geometry that already guaranteed translateZ and scale could not. */
					const dx = (p.key === 'l' ? 1 : -1) * trav * diagX;
					const dy = trav * DIAG_Y;
					p.el.style.transform =
						'rotateY(' +
						(-theta).toFixed(3) +
						'deg) translate3d(' +
						dx.toFixed(2) +
						'px,' +
						dy.toFixed(2) +
						'px,0) translateZ(' +
						zPush.toFixed(1) +
						'px) scale(' +
						s.toFixed(4) +
						')';
					/* LIGHT. 0.17 was the whole problem stated as a number: a 17% shade is not "in the
					   periphery", it is "very slightly less lit", which is why both photographs read as
					   equally present. 0.62 puts the unattended plate genuinely in shadow, and together with
					   the depth above it leaves no doubt which one the frame is about.
					   The CAPTION does not follow it that far, deliberately. A previous pass dimmed the
					   unattended caption to 30% and the render became ambiguous about which words belonged to
					   which photograph — a legibility failure dressed as art direction. Every word stays
					   readable at every angle; the hierarchy is carried by the photographs, not by making
					   text hard to read. */
					if (p.shade) p.shade.style.opacity = (0.62 * (1 - look)).toFixed(3);
					if (p.copy) p.copy.style.opacity = (0.6 + 0.4 * look).toFixed(3);
				}
			}

			if (desktop) {
				gsap.set(spread, { perspective: PERSPECTIVE, perspectiveOrigin: '50% 50%' });
				gsap.set(pair, { transformStyle: 'preserve-3d' });
				gsap.set(plates.map((p) => p.el), { transformStyle: 'preserve-3d' });

				const st = ScrollTrigger.create({
					trigger: spread,
					start: 'top top',
					/* P8.6 (D-77): +=150% → +=90%. 150% of the viewport is 1350px of scrolling during which
					   the page does not advance at all, and however good the movement inside it is, a
					   stall that long is itself the "stroef" the brief asks to remove ("kort. elegant.
					   niet stroef."). At 90% the whole traverse — A alone, the look across, B alone —
					   still has three clear acts, and the beat is 40% shorter in the reader's hand. */
					end: '+=90%',
					pin: true,
					pinSpacing: true,
					/* A numeric scrub instead of `true`. `true` binds the composition to the raw scroll
					   position, so a wheel notch or a trackpad flick is delivered as a step; 0.5s of
					   catch-up is what turns those steps into one continuous move without ever detaching
					   the movement from the reader's hand (item 9: "geen schokken, geen haperingen"). */
					scrub: scrubFor(0.5, coarse),
					fastScrollEnd: true,
					onUpdate: (self) => {
						turn = self.progress;
						applyTurn();
					},
					onRefresh: (self) => {
						turn = self.progress;
						applyTurn();
					},
				});
				spreadST = st;
				applyTurn();
			} else {
				/* MOBILE. One column, both photographs full width, no pin and no 3D: a rotation about a
				   vertical axis is meaningless when the plates are stacked, and at 390px any lateral travel
				   pushes a full-width photograph toward an edge. What mobile gets instead is the same
				   ATTENTION language expressed vertically — each plate lights as it reaches the middle of
				   the screen and quiets as it leaves. Complete, not identical (blueprint 7.127–7.129). */
				/* P8.5 (D-76): the same "one at a time" statement, expressed vertically. Deepened 0.4 → 0.7
				   to match the desktop shade, and the window ends at `center 46%` rather than `center 42%`
				   so a plate is fully lit only once it is genuinely the middle of the screen — on a stacked
				   layout that is what stops two photographs being half-lit at the same moment. */
				for (const p of plates) {
					gsap.timeline({
						defaults: { ease: 'none' },
						scrollTrigger: { trigger: p.el, start: 'top 86%', end: 'center 46%', scrub: scrubFor(0.8, coarse) },
					})
						.fromTo(p.shade, { opacity: 0.7 }, { opacity: 0, ease: 'power2.out' }, 0)
						.fromTo(p.copy, { autoAlpha: 0.34 }, { autoAlpha: 1, ease: 'power2.out' }, 0);
				}
			}

			/* ── THE SPECIFICATION WALL — light, and nothing else ─────────────────────────────────────
			   WHY THIS BEAT EXISTS: after looking across two buildings, the question changes from "what is
			   this" to "what does it actually get me". It is the page's most factual passage, and the right
			   camera for a factual passage is NO camera at all — nothing here translates, scales or fades in.

			   Its carrier is a RAKING LIGHT that travels down the wall as you pass it. The four toepassingen
			   rows each carry a champagne catch-light on their leading hairline (D-28's gold index idiom),
			   and the light walks down them in turn: the wall is lit from a moving source, the way a real
			   surface is. Nothing arrives, nothing assembles, nothing has "happened" — the reader simply
			   passes a lit wall. It is the only beat on the site whose entire direction is illumination.

			   Four opacity writes per frame, on elements that already exist. No new DOM, no gradient
			   repaint, no layout read inside the ticker. */
			const appRows = scopeSec ? [...scopeSec.querySelectorAll('.svc-applist__item')] : [];
			if (appRows.length) {
				const wallLight = gsap.timeline({
					defaults: { ease: 'none' },
					/* THE WALK HAPPENS WHILE THE WALL IS ON SCREEN. A first cut ran it from `top 88%` and it
					   was entirely spent during the APPROACH: MEASURED, by the time the section was
					   properly in view every row had already settled and the reader met a wall the light
					   had finished crossing. The beat is timed to the reading, not to the section box. */
					scrollTrigger: { trigger: scopeSec, start: 'top 64%', end: 'bottom 82%', scrub: scrubFor(0.9, coarse) },
				});
				appRows.forEach((row, i) => {
					// The light reaches each row a beat after the last, holds on it, and moves on. `--tick`
					// is read by the row's own catch-light and sheen, so the LIGHT is what travels.
					// It settles at 0.5, not at dark: a wall the light has passed is still a lit wall, and
					// the index has to stay comfortably legible long after the gesture is over.
					const at = 0.08 + i * 0.17;
					wallLight
						.fromTo(row, { '--tick': 0.34 }, { '--tick': 1, duration: 0.2 }, at)
						.to(row, { '--tick': 0.5, duration: 0.36 }, at + 0.2);
				});
			}

			/* ── THE CRANE PAST THE WALL — de dienst ──────────────────────────────────────────────────
			   The raking light above is this beat's SURFACE. This is its CAMERA, and the beat needs one:
			   rendered, "light only" was indistinguishable from a static page — the light walks across four
			   hairlines that occupy a fifth of the frame, and a reader passing the other four fifths saw
			   nothing move at all. That is exactly where the film used to stop.

			   The move is not an animation of a heading or a list. It is DEPTH. The statement is at reading
			   distance and the toepassingen index is set back against the wall behind it, and the camera
			   cranes past both — so the near plane sweeps a long way across the view while the far one
			   barely shifts. That ratio is the only thing that says "I am moving through a space" rather
			   than "a page is scrolling", and it costs two transforms.

			   It is a PASS, not an arrival: both planes travel continuously from before their place, through
			   it, to after it. Nothing fires on a threshold and there is no moment at which this beat has
			   "happened", so scrolling back up unmakes it exactly. */
			const scopeMain = scopeSec && scopeSec.querySelector('.svc-scope__main');
			const scopeApps = scopeSec && scopeSec.querySelector('.svc-scope__apps');
			if (scopeSec && scopeMain && scopeApps) {
				const crane = gsap.timeline({
					defaults: { ease: 'none', force3D: true },
					scrollTrigger: { trigger: scopeSec, start: 'top bottom', end: 'bottom top', scrub: scrubFor(0.85, coarse) },
				});
				// NEAR — travels far, and drifts laterally as well, because a camera moving past something
				// close to it changes its bearing on it. The lateral term is small and inward-bound so no
				// line of type ever approaches the column's own gutter.
				crane.fromTo(
					scopeMain,
					{ y: 62 * A, x: 14 * A },
					{ y: -62 * A, x: -6 * A, duration: 1 },
					0
				);
				// FAR — set back against the wall, so it holds nearly still. The gap between these two
				// numbers IS the depth of the room.
				crane.fromTo(scopeApps, { y: 17 * A }, { y: -17 * A, duration: 1 }, 0);
			}

			/* ── THE DESCENT — de werkwijze ───────────────────────────────────────────────────────────
			   The spread is behind you and the question changes again: how does this actually happen. It is
			   the page's most human passage, and its job is to bring the reader back down to earth.

			   So it is the one place the camera travels DOWNWARD — the exact inverse of the climb, and the
			   only downward move on the page. When a head tilts down, everything in frame rises; the three
			   steps therefore RISE PAST the reader as the altitude arc brings the horizon back in behind them.

			   IT IS A PASS, NOT AN ARRIVAL. Each step travels continuously from below its place, THROUGH it,
			   to above it — nothing fires on a threshold, nothing assembles, nothing completes. There is no
			   moment at which this beat "has happened", which is what separates travelling through somewhere
			   from watching a section animate in (§3.1 #3).

			   THE THREE STEPS PASS IN SEQUENCE, and that had to be built deliberately: given a trigger each,
			   they sat within ~100px and all three read the same offset at the same scroll position — three
			   things moving by the same amount at the same time is one block sliding. One timeline over the
			   whole beat, each step entered later than the last, makes the descent sequential. */
			const methodBlock = document.querySelector('.svc-method');
			const steps = methodBlock ? [...methodBlock.querySelectorAll('.svc-method__item')] : [];
			if (methodBlock && steps.length) {
				const STEP_IN = 0.13;
				const span = 1 - STEP_IN * (steps.length - 1);
				const descent = gsap.timeline({
					defaults: { ease: 'none', force3D: true },
					scrollTrigger: { trigger: methodBlock, start: 'top bottom', end: 'bottom top', scrub: scrubFor(0.8, coarse) },
				});
				steps.forEach((item, i) => {
					const num = item.querySelector('.svc-method__num');
					const words = item.querySelectorAll('h3, p');
					const at = i * STEP_IN;
					// FAR: the display numeral is structure — the marker you descend past, so it barely moves.
					// NEAR: the words are at reading distance and travel four times as far. Same two planes,
					// and the same physics, as the climb — pointed the other way.
					if (num) descent.fromTo(num, { y: 10 * A }, { y: -10 * A, duration: span }, at);
					if (words.length) descent.fromTo(words, { y: 38 * A }, { y: -38 * A, duration: span }, at);
				});
			}

			/* ── THE SETTLE — relevante projecten ─────────────────────────────────────────────────────
			   After a climb, a turn, a lit wall and a descent, the camera arrives somewhere and comes to
			   REST. That is this beat's whole verb, and it is a different one from every other beat on the
			   page: not travel, not light, not composition — DECELERATION.

			   It is built as one scrubbed pass on a `power3.out` curve, which means the movement is nearly
			   all spent in the beat's first third and then asymptotically stills as the work centres. The
			   reader feels the camera slowing down and settling on the photographs, and by the time they
			   are actually reading, nothing is moving at all. Stillness that you ARRIVED at reads as calm;
			   stillness that was simply always there reads as a static page, and that difference is the
			   entire reason this beat used to be where the film died.

			   The heading is the far plane and the work is the near one, so the deceleration has depth in
			   it too rather than being one block easing to a stop. */
			const relHead = relSec && relSec.querySelector('.rel__head');
			const relItems = relSec ? [...relSec.querySelectorAll('.rel__item')] : [];
			if (relSec && relItems.length) {
				const settle = gsap.timeline({
					defaults: { force3D: true },
					scrollTrigger: { trigger: relSec, start: 'top bottom', end: 'center 46%', scrub: scrubFor(1, coarse) },
				});
				if (relHead) settle.fromTo(relHead, { y: 30 * A }, { y: 0, ease: 'power3.out', duration: 1 }, 0);
				relItems.forEach((item, i) => {
					settle.fromTo(
						item,
						{ y: (86 - i * 14) * A },
						{ y: 0, ease: 'power3.out', duration: 1 },
						i * 0.06
					);
				});
			}

			/* ── THE LAST MARK ────────────────────────────────────────────────────────────────────────
			   The CTA's gold datum rule is the film's terminal line — D-28's architect's dimension line, and
			   the only gold with meaning on this page. It is DRAWN, once, from the left, as the closing beat
			   arrives: an architect finishing a drawing. Scrubbed 1:1 with scroll and fully reversible, so it
			   is not a reveal that has "happened" — scroll back up and the line unmakes itself.

			   This is the page's only single-gesture beat, and it is deliberately the last thing: after a
			   climb, a turn, a lit wall and a descent, the film ends on one line being drawn and then
			   stillness. Nothing else in the CTA moves at all. */
			if (ctaSec) {
				gsap.fromTo(
					ctaSec,
					{ '--datum': 0 },
					{
						'--datum': 1,
						ease: 'none',
						scrollTrigger: { trigger: ctaSec, start: 'top 92%', end: 'top 34%', scrub: scrubFor(0.9, coarse) },
					}
				);
			}

			ScrollTrigger.refresh();

			return () => {
				gsap.ticker.remove(update);
				ScrollTrigger.removeEventListener('refresh', refreshMetrics);
				docEl.classList.remove('motion-scene');
			};
		}
	);

	// Backstop: tear everything down on a full-page unload (no leaks).
	window.addEventListener('pagehide', () => mm.revert(), { once: true });
}
