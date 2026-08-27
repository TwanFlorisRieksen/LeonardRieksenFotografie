/*
 * interieur-cinema.js — `/diensten/interieurfotografie/`. THE NEAR PLANE.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────
 * THE FILM (§10's three questions, answered from THIS page's three photographs and from nowhere else).
 *
 *   SENTENCE — "You are inside a building. You walk forward: the walls, the floor and the lit ceiling
 *               stream past you, and the doorways narrow and open as you pass through them. Halfway you
 *               come into a room and stop, and there you turn your head — from a glass threshold that
 *               opens onto a wood, round to the foot of a stair that climbs toward light."
 *
 *   THE HOUR — INTERIOR, at dusk. Read off the Eemhuis frame, which is precisely this: a warm-lit hall
 *               whose glass wall is full of blue dusk. Warm light from within, cool light from beyond the
 *               glass, meeting in the room. That is the brand's own blue-hour/gold duet occurring as a
 *               real photograph's real light, which is the one place §5.3 permits gold to be atmosphere.
 *
 *               AND THE COLOUR DRAINS IN THE MIDDLE. Both representative photographs are BLACK AND WHITE.
 *               D-29's standing rule is that a monochrome photograph may cast no colour, so rather than
 *               fight that, the film is built ON it: the room goes SILVER as you reach the spread and
 *               warms again as you come out. The page's colour arc — warm → silver → warm — is not a
 *               decision about taste, it is what Leo's frames actually contain.
 *
 *   MECHANISM — THE NEAR PLANE. This is the one thing only this page does. Every other world on this site
 *               is FAR: the homepage's sky, the diensten room's walls and the architectuur page's weather
 *               are all distant, soft and behind everything. An interior is the opposite. The surfaces
 *               closest to you sweep past fastest, while the far end of the room barely moves — and that
 *               differential IS the sensation of walking forward. So this world has depth planes with
 *               different speeds: two JAMBS at the viewport's edges (near walls, fast), a FLOOR and a
 *               CEILING (near, fast), and a BEYOND — the cool dusk through the glass (far, slow).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────
 * P8.3 — THE SPREAD, AND WHY THE HEAD TURN IS NOT THE ARCHITECTUUR PAGE'S.
 *
 * The two black-and-white studies used to be two consecutive 100svh rooms with an arrival each. That
 * spent most of the page's attention on photography and left everything after it reading as the
 * remainder. They are now ONE editorial spread — side by side, sharing a baseline, deliberately smaller —
 * and the camera turns its head across them.
 *
 * Both service pages received that instruction, and the two must not feel like one template. They do not,
 * because the PARALLAX RATIO is inverted. On the architectuur page the reader stands in the open and
 * everything behind them is far: the sky pans a fraction of the composition's travel. Here the reader
 * turns their head INSIDE a room, so the near walls cross the whole field of view while the dusk beyond
 * the glass hardly shifts. Same instruction, opposite building.
 *
 * And the turn is not neutral, because the two photographs are opposite kinds of room. The Kröller
 * pavilion is a glass THRESHOLD, so while the head is pointed at it the jambs stand wide open; the Arnhem
 * stairwell is a NARROW one-point climb, so as the head comes round the walls close back in and what
 * arrives instead is the light at the top of the stair. Turning your head here is the difference between
 * standing in glass and standing in a shaft — read off Leo's two frames (§6.2), never chosen.
 *
 * THE PHOTOGRAPH IS PROVABLY UNDAMAGED. The rail rotates under a perspective; each plate carries the
 * exact inverse rotation, so every photograph's plane stays PARALLEL to the screen and a plane parallel
 * to the projection plane cannot keystone — the perspective can only scale it uniformly. Never sheared,
 * stretched, cropped, masked or foreshortened. A geometric guarantee, measured on the render anyway.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────
 * CLIP-SAFETY — the photograph is never cropped, masked, stretched, feathered or upscaled at any scroll
 * position. As on the architectuur page, the geometry is solved BACKWARDS from the travel the timeline
 * will actually spend: the excursion plus a safety margin is reserved first, and the photograph is sized
 * into what is left, capped at its own native width. Here that is easier than it sounds, because this
 * page's whole point is that the photographs move very little — the world does the travelling.
 *
 * PROGRESSIVE ENHANCEMENT (§P13). Arms only under `prefers-reduced-motion: no-preference`. Under reduce
 * or no-JS `motion-scene` is never set, the stage stays invisible, and the page renders as the calm
 * static composition it already was, with every photograph complete and every word and link present.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { clamp01, smoothstep } from './motion-math.js';

const ramp = (v, a, b) => smoothstep(clamp01((v - a) / (b - a)));
const DEG = Math.PI / 180;

export function initInterieurCinema() {
	if (typeof window === 'undefined' || !window.matchMedia) return;
	const docEl = document.documentElement;
	const stage = document.querySelector('.stage');
	if (!stage) return;

	const beyond = stage.querySelector('.stage__beyond');
	const jambL = stage.querySelector('.stage__jamb--l');
	const jambR = stage.querySelector('.stage__jamb--r');
	const floor = stage.querySelector('.stage__floor');
	const ceil = stage.querySelector('.stage__ceil');
	const silver = stage.querySelector('.stage__silver');
	const glow = stage.querySelector('.stage__glow');
	if (!beyond || !jambL || !jambR || !floor || !ceil || !silver || !glow) return;

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

	// The three beats after the stairwell. They are part of the walk, not a tail appended to it.
	const uitleg = document.querySelector('.svc-uitleg-sec');
	const seq = document.querySelector('.svc-seq-sec');
	const rel = document.querySelector('.rel');
	const cta = document.querySelector('.cta');

	const mm = gsap.matchMedia();

	mm.add(
		{
			motion: '(prefers-reduced-motion: no-preference)',
			desktop: '(min-width: 52.0625rem)',
		},
		(ctx) => {
			const { motion, desktop } = ctx.conditions;
			if (!motion) {
				docEl.classList.remove('motion-scene');
				return;
			}

			gsap.registerPlugin(ScrollTrigger);

			// Mobile keeps the whole world — the jambs, the streaming floor and ceiling, the colour drain and
			// both arrivals. What it drops is the pins (§7.6: never below ~833px) and some amplitude. A
			// complete experience, not a reduced desktop fallback (blueprint 7.127–7.129).
			const A = desktop ? 1 : 0.62;

			let vw = docEl.clientWidth;
			let vh = window.innerHeight;
			let maxScroll = Math.max(1, docEl.scrollHeight - vh);

			const SAFE = 26;

			/* ── THE SPREAD'S GEOMETRY, SOLVED BACKWARDS FROM THE TURN ────────────────────────────────
			   The plates are sized to a HEIGHT budget first (they must be smaller than they were — that is
			   the point of this pass), and the turn's amplitude is solved from whatever free width the
			   resulting composition leaves. The excursion is a consequence of the layout, never a constant
			   hoping the layout will accommodate it.

			   `share` is each plate's ceiling as a fraction of the rail, and the two are deliberately very
			   unequal: the pavilion is a 2.2:1 panorama and the stairwell a portrait. Mirrored against the
			   architectuur page, where the portrait leads. */
			/* `heightCap` is a fraction of the room ACTUALLY left after the standfirst and the captions have
			   been paid for — not of the raw viewport. Sizing against the raw viewport is how the previous
			   pass ended up crowded: every pixel the copy needed came out of the air around the photographs. */
			const PLATE = {
				l: { share: 0.56, heightCap: 0.62 },
				r: { share: 0.3, heightCap: 0.94 },
			};
			const TURN_DEG = desktop ? 10 : 0;
			const PERSPECTIVE = 1150;
			/* The lateral sweep is deliberately smaller than the depth change — a large one reads as the
			   composition sliding across a page. The turn is carried by DEPTH, by LIGHT, and above all on
			   this page by the ROOM: the near jambs swing a long way while the dusk beyond the glass barely
			   moves at all. That ratio is this page's whole mechanism, and it is the exact opposite of the
			   architectuur page's, where everything behind the reader is far and slow. */
			const SWEEP_MAX = 62;
			/* ── THE TRAVERSE (P8.6 / D-77) — identical construction to the architectuur spread; see
			   arch-cinema.js for the full reasoning. In short: the reader is travelling DOWN, the pin
			   arrested that completely, and every pixel of movement after it was lateral — "verticaal →
			   ineens horizontaal". Every moving thing in the beat now travels one straight diagonal, the
			   vertical component never stops and never reverses, and the two plates are mirrored:
			     photo A (the pavilion, left) top-left  → bottom-right;
			     photo B (the stair, right)   top-right → bottom-left.
			   Both amplitudes are charged to the layout before the movement exists. */
			const DIAG_Y = desktop ? 30 : 0;
			const MIN_GAP = 52; // air the two plates must keep at their closest, px.

			let sweep = 0;
			let diagX = 0;

			function layoutSpread() {
				let chrome = 0;
				if (desktop) {
					if (head) chrome += head.getBoundingClientRect().height + 56;
					let capH = 0;
					for (const p of plates) if (p.copy) capH = Math.max(capH, p.copy.getBoundingClientRect().height);
					chrome += capH;
				}
				/* 150px of air the photographs are not allowed to spend — a composition decision, so it is a
				   constant rather than whatever happens to be left over. */
				/* P8.6 (D-77): 2 × DIAG_Y is charged here, before the photographs are sized — the scene rides
				   that far above the designed position at the start of the beat and that far below it at the
				   end. */
				const room = Math.max(240, vh - chrome - 150 - 2 * DIAG_Y);

				for (const p of plates) {
					const cfg = PLATE[p.key];
					const byHeight = room * cfg.heightCap * (p.natW / p.natH);
					const railW = rail.clientWidth || vw;
					// Never above native width: no upscale, ever.
					const w = Math.round(Math.min(byHeight, railW * cfg.share, p.natW));
					p.el.style.setProperty('--plate-w', w + 'px');
					p.h = w / (p.natW / p.natH);
				}
				/* THE STEP. A panorama and a portrait cannot share a baseline without one of them being
				   starved. They are top-aligned instead, with the shorter frame dropped so the two OPTICAL
				   CENTRES agree — which is also why the datum hairline that used to tie them together is no
				   longer needed by the composition at all. */
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
				const railRect = pair.getBoundingClientRect();
				const cx = railRect.left + railRect.width / 2;
				let halfContent = 0;
				for (const p of plates) {
					const r = p.el.getBoundingClientRect();
					p.x0 = r.left + r.width / 2 - cx;
					halfContent = Math.max(halfContent, Math.abs(p.x0) + r.width / 2);
				}
				/* The rotation pushes the nearer plate outward by the perspective's own scale factor, so
				   that growth is charged to the margin here too — the term that is easy to forget and
				   exactly how "the numbers were fine and the render clipped" happens. */
				const grow =
					halfContent * (PERSPECTIVE / (PERSPECTIVE - halfContent * Math.sin(TURN_DEG * DEG)) - 1);
				sweep = Math.max(0, Math.min(SWEEP_MAX, vw / 2 - halfContent - grow - SAFE));

				/* THE DIAGONAL'S LATERAL HALF-AMPLITUDE (P8.6 / D-77). Clamped by BOTH the free margin at
				   the viewport edges (each plate swings outward by this much at one end of the beat) and a
				   quarter of the gap between the plates (they converge by twice this at the other end).
				   Nothing in the old `sweep` calculation covered the second: the pair used to move as one,
				   so the gap between the two never changed. */
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

			/* ── YOU DO NOT WALK THROUGH A BUILDING AT A CONSTANT SPEED ───────────────────────────────
			   `walk` was `scrollY / maxScroll`: a conveyor belt that advanced at exactly the same rate
			   whether the reader was moving down a corridor or standing still inside a pinned room looking
			   at a photograph. It made the two rooms — the only places on this page where the visitor STOPS
			   — indistinguishable from the passages between them, and it spent the whole world before the
			   halfway mark. MEASURED on the render at the uitleg, seq, related and CTA beats: ceiling 0,
			   silver 0, glow 0, `beyond` fixed at 0.400, jambs frozen at maximum pinch for 3,200px. Forty
			   per cent of this page was a corridor with nothing happening in it at all.

			   So the walk now STOPS while you are standing in a room. Scroll spent inside either scene's pin
			   does not advance it; scroll spent between them does. Standing still and walking forward become
			   different things, which on a page whose entire mechanism is forward motion is the difference
			   between a building and a hallway. It also leaves the world with something left to spend after
			   the stairwell — which is what the whole back half is now directed with. */
			let pinned = [];
			function walkAt(y) {
				let w = y;
				for (const p of pinned) {
					if (y >= p.end) w -= p.end - p.start;
					else if (y > p.start) w -= y - p.start;
				}
				const span = Math.max(1, maxScroll - pinned.reduce((a, p) => a + (p.end - p.start), 0));
				return clamp01(w / span);
			}

			function refreshMetrics() {
				vw = docEl.clientWidth;
				vh = window.innerHeight;
				maxScroll = Math.max(1, docEl.scrollHeight - vh);
				layoutSpread();
				pinned = spreadST ? [{ start: spreadST.start, end: spreadST.end }] : [];
			}

			/* How near the spread is, read LIVE off its position — robust against pinning, which reports a
			   stable rect while you are standing inside it. */
			function roomNear() {
				const b = rail.getBoundingClientRect();
				const dist = Math.abs(b.top + b.height / 2 - vh / 2);
				return clamp01(1 - Math.max(0, dist - vh * 0.16) / (vh * 0.8));
			}

			/* ── THE HEAD ANGLE ───────────────────────────────────────────────────────────────────────
			   `turn` runs 0 (looking at the pavilion) → 1 (looking at the stairwell). It is the pinned
			   scene's own progress, shaped so the head DWELLS at each end and moves between them: you
			   arrive, you settle, you look across, you settle. A linear sweep reads as a mechanism; an
			   eased one with real dwell at both ends reads as looking. */
			let turn = 0;
			let spreadST = null;
			/* P8.5 (D-76) — the same three-act window as the architectuur spread: A alone (0 → 0.32), the
			   look across (0.32 → 0.68), B alone (0.68 → 1). The old 0.22 → 0.78 spent 56% of the beat with
			   the head pointed BETWEEN the two photographs, which is the one state in which neither of them
			   is the subject. See arch-cinema.js for the full reasoning; the two spreads are one mechanism
			   and must not drift apart. */
			const gaze = (t) => smoothstep(clamp01((t - 0.32) / 0.36));

			/* The same reading for a whole section rather than a photograph — how much of the viewport a
			   later beat currently owns. Tolerant of tall blocks: a section taller than the viewport counts
			   as fully near while you are anywhere inside it, which a centre-distance measure would not do. */
			function near(el) {
				if (!el) return 0;
				const b = el.getBoundingClientRect();
				const top = Math.max(0, b.top);
				const bottom = Math.min(vh, b.bottom);
				return clamp01((bottom - top) / Math.min(vh, Math.max(1, b.height)));
			}

			/* ── THE ROOM YOU ARE WALKING THROUGH (one update, every frame) ────────────────────────────
			   `walk` is how far through the building you are. Near surfaces are driven fast off it, the far
			   `beyond` slowly — and that RATIO is the whole mechanism. Every value is a pure function of
			   scroll position, so the walk reverses exactly and a fling cannot desynchronise anything. */
			function update() {
				const t = gsap.ticker.time;
				const walk = walkAt(window.scrollY);
				const inRoom = roomNear();
				const g = gaze(turn);
				/* THE TWO PHOTOGRAPHS ARE OPPOSITE KINDS OF ROOM, and the head turning between them is what
				   changes the room around the reader. The Kröller pavilion is a glass THRESHOLD — a box you
				   can see straight out of — so while the head is pointed at it the jambs stand WIDE OPEN.
				   The Arnhem stairwell is a NARROW one-point climb toward a bright vanishing point, so as
				   the head comes round to it the walls close back in and what arrives instead is the light
				   at the top of the stair. Turning your head inside this building is therefore not a
				   neutral sweep: it is the difference between standing in glass and standing in a shaft.
				   Read straight off Leo's two frames (§6.2), never chosen. */
				const n1 = inRoom * (1 - g); // the pavilion's share of the gaze
				const n2 = inRoom * g; // the stairwell's share
				/* THE REST OF THE BUILDING. The three beats after the stairwell are not filler between the
				   photographs and the footer — they are the rooms you walk through on the way out, and each
				   one is a different KIND of space. Their nearness is read the same way the rooms' is, off
				   live geometry, so it survives pinning and reverses for free. */
				const nUit = near(uitleg);
				const nSeq = near(seq);
				const nRel = near(rel);
				const nEnd = near(cta);

				// THE DOORWAYS. The jambs squeeze IN as you approach a room and swing OUT as you enter it —
				// but only where the room actually opens. Scene I is a glass threshold and flies open;
				// scene II is a stairwell and stays shut, so its `open: 0` keeps the walls close and the
				// release has to come from the light instead. `pinch` is the passage between rooms: at its
				// tightest exactly where neither room is near, so the corridor is genuinely a corridor.
				const pinch = 1 - inRoom;
				/* THE WAY OUT, WRITTEN AS SPACE. The jambs were doing exactly one thing after the stairwell:
				   sitting at maximum pinch, forever. Three more terms give the last three beats each their
				   own kind of room, and they are chosen from what those beats ARE, not from a menu:
				     · THE SEQUENCE squeezes IN. It is the most intimate passage of writing on the page —
				       how Leo actually works, step by step — so the walls come closer than anywhere else on
				       this site while you read it. Enclosure is the carrier; nothing here "animates".
				     · RELEVANTE PROJECTEN opens OUT, wider than any room but the threshold: you have come
				       back into the hall, and there is other work along it.
				     · THE CTA settles to a calm, near-neutral width. The far door. Neither squeezed nor flung
				       open — simply somewhere you can stand still. */
				const openness = n1 * 1 + n2 * 0; // the pavilion opens the walls; the stairwell never does.
				const jamb =
					(pinch * 5.2 - openness * 7.4 + nSeq * 3.4 - nRel * 5.6 - nEnd * 3.1) * A; // +in, −out, vw.
				const sway = Math.sin(t * 0.1) * 0.34 * A; // the room lives at rest (§5.7).
				/* THE NEAR WALLS SWEEP WITH THE HEAD, AND THE DUSK BEYOND THE GLASS DOES NOT.
				   This is the term that makes the turn read as a turn on THIS page. In a real room the
				   surface a metre from your shoulder crosses your whole field of view when you look
				   sideways, while the far end of the room hardly shifts at all. So the jambs take the head
				   angle at full strength — and, being walls on opposite sides of you, they take it in the
				   SAME screen direction rather than mirrored, which is what distinguishes a room panning
				   past you from a doorway opening. `beyond` (below) takes a fraction of it. */
				const headPan = (1 - 2 * g) * 3.1 * A * inRoom; // vw
				jambL.style.transform = 'translate3d(' + (jamb + sway + headPan).toFixed(2) + 'vw,0,0)';
				jambR.style.transform = 'translate3d(' + (-jamb - sway + headPan).toFixed(2) + 'vw,0,0)';
				jambL.style.opacity = jambR.style.opacity = (0.42 + 0.34 * pinch).toFixed(3);

				// THE NEAR SURFACES STREAM PAST. Floor and ceiling are the fastest things in the world; the
				// `beyond` is the slowest. You are not watching them move — you are moving past them, and
				// the difference between those two readings is entirely this speed ratio.
				// Signs matter and are not a detail: walking FORWARD, the floor under you comes toward you and
				// passes DOWN out of frame, while the ceiling overhead recedes UP out of it. Inverting either
				// one renders as walking backwards — which is what a first cut did, and it reads as the room
				// being dragged past you rather than you moving through it.
				/* A NEW ROOM HAS A NEW LIGHT IN IT — and without this the passage had none.
				   The floor pool streams DOWN past you for the whole walk, which is correct while you are
				   walking. But over the length of a page it eventually streams all the way out: MEASURED at
				   the sequence beat, the floor layer's own glow core sat at y=1106 in a 900px viewport —
				   206px below the fold. Raising its opacity there (which is what a first pass did) lit
				   something nobody could see, and left the squeezing jambs biting into black.
				   So as you come into the narrow passage, a fresh pool of light rises into it from ahead —
				   the next lamp in the corridor, arriving because you walked far enough to reach it. It is
				   tied to the beat's own nearness, so it glides in with the reader rather than switching on. */
				floor.style.transform =
					'translate3d(0,' + (walk * 64 * A - nSeq * 40 * A).toFixed(2) + 'vh,0)';
				ceil.style.transform =
					'translate3d(0,' + (-walk * 54 * A + (nRel * 26 + nUit * 16) * A).toFixed(2) + 'vh,0)';
				beyond.style.transform =
					'translate3d(calc(' +
					(Math.sin(t * 0.07) * 0.8 * A).toFixed(2) +
					'% + ' +
					(headPan * 0.16).toFixed(2) +
					'vw),' +
					(-walk * 13 * A).toFixed(2) +
					'vh,0)';

				// The lit ceiling is overhead in the first hall and gone by the stairwell — and then it
				// COMES BACK as you walk out into the hall of projects, because that hall has a ceiling
				// too. It was a one-way fade to nothing before, which is why the last third of the page
				// had no light source in it at all.
				/* ── EACH OF THE LAST FOUR BEATS IS LIT FROM A DIFFERENT PLACE ────────────────────────
				   The enclosure built above was real and MEASURED and completely invisible: these jambs are
				   near-black shadow walls (rgba(4,5,8,.92)), so they only read where there is light for
				   them to bite into — and the whole back half had none. Squeezing shadow against shadow is
				   the "technically present, experientially absent" failure this project has been rejected
				   for before, and no amount of correct geometry substitutes for a light source.

				   So the four rooms you walk out through are lit from four different directions, which is
				   also what stops them becoming one repeated beat:
				     · UITLEG   — OVERHEAD. You are back in a hall with a ceiling after the stairwell.
				     · SEQ      — UNDERFOOT, warm and low. A narrow passage lit close to the floor: the
				                  intimate light, for the most practical writing on the page, and the light
				                  the squeezing jambs finally have something to close in on.
				     · RELATED  — OVERHEAD and wider. The hall opens; there is other work along it.
				     · CTA      — from BEYOND, through the glass (see `beyond` below). The only beat on this
				                  page whose light comes from the distance rather than from the room. */
				ceil.style.opacity = (
					0.72 * (1 - ramp(walk, 0.1, 0.62)) +
					nUit * 0.3 +
					nRel * 0.34 +
					nEnd * 0.16
				).toFixed(3);
				floor.style.opacity = (0.34 + 0.4 * (1 - ramp(walk, 0.24, 0.86)) + nSeq * 0.36).toFixed(3);
				// THE FAR DOOR. `beyond` is the cool dusk seen through the glass — the slowest, furthest
				// thing in this world. It lifts in the rooms, and then goes on lifting at the very end of
				// the page: you are walking toward the way out, and the light that grows is the evening
				// outside it. The page's last frame is therefore the brightest distance on it, which is
				// the opposite of every other beat here, where the light has always been overhead or
				// underfoot. Nothing moves; the distance simply opens.
				beyond.style.opacity = (0.4 + 0.34 * inRoom + nEnd * 0.3).toFixed(3);

				// THE COLOUR DRAINS. Both representative photographs are black and white and may cast no
				// colour of their own (D-29), so the room desaturates to meet them and warms again as you
				// leave. It is the page's arc, and it is read straight off the frames rather than chosen.
				// Both photographs are black and white and may cast no colour of their own (D-29), so the
				// room desaturates to meet the spread and warms again as the reader leaves it.
				silver.style.opacity = (0.86 * inRoom).toFixed(3);

				// The stairwell's release: the light at the top of the stair, blooming from the
				// photograph's own vanishing point. Scene I opens by SPACE, scene II by LIGHT.
				// The stairwell's release: the light at the top of the stair, blooming from the photograph's
				// own vanishing point as the head comes round to it. The pavilion opens by SPACE, the
				// stairwell by LIGHT — the two are released in opposite ways, and the head turn is what
				// hands the reader from one to the other.
				glow.style.opacity = (n2 * 0.82).toFixed(3);
			}

			refreshMetrics();
			update();
			docEl.classList.add('motion-scene');
			gsap.ticker.add(update);
			ScrollTrigger.addEventListener('refresh', refreshMetrics);

			/* ── THE TURN ─────────────────────────────────────────────────────────────────────────────
			   Applied from the same ticker as the room, off one shared `turn` value, so the composition and
			   the world can never disagree by a frame. Every write is a transform or an opacity. */
			function applyTurn() {
				const g = gaze(turn);
				const theta = (1 - 2 * g) * TURN_DEG; // +TURN = looking at the pavilion, −TURN = the stair.

				/* THE TRAVERSE (P8.6 / D-77). `trav` runs −1 → +1 once across the beat and never turns
				   around. It is smoothstepped on the RAW pinned progress rather than on `gaze` — gaze is
				   shaped for the attention handover and holds still at both ends, which would freeze the
				   movement exactly where the pin engages and releases. A smoothstep has zero velocity at
				   both ends, so the traverse eases in as the pin takes hold and out as it lets go. */
				const sp = turn * turn * (3 - 2 * turn);
				const trav = 2 * sp - 1;

				pair.style.transform = 'rotateY(' + theta.toFixed(3) + 'deg)';
				// The standfirst stays square to the screen (rotating a text block through a perspective
				// softens its glyphs) and drifts against the plates on the same diagonal at a fraction of
				// the travel, so it reads as the far plane rather than as another moving box.
				if (head)
					head.style.transform =
						'translate3d(' +
						(-trav * diagX * 0.26).toFixed(2) +
						'px,' +
						(trav * DIAG_Y * 0.34).toFixed(2) +
						'px,0)';

				/* THE HANDOVER CURVE (P8.5 / D-76). A second smoothstep on the attention only: flat at each
				   end, steep through the crossing, so the instant where both plates are equal is passed
				   through rather than dwelt in. A handover, not a dissolve. Geometry keeps the first `g`. */
				const gg = g * g * (3 - 2 * g);
				for (const p of plates) {
					const look = p.key === 'l' ? 1 - gg : gg;
					/* DEPTH carries more of the hierarchy here than on the architectuur page, and for a real
					   reason: both of these photographs are BLACK AND WHITE, where a heavy shade reads as
					   murk rather than as distance. So the recession is the same 60px/4% as the architectuur
					   spread, but the shade is held to 0.44 rather than 0.62 — the same statement, told with
					   more space and less darkness. Both terms are inside the plate's own counter-rotated,
					   screen-parallel space, so neither can keystone or crop the photograph. */
					const zPush = -60 * (1 - look) + 20 * look;
					const s = 1 - 0.04 * (1 - look);
					/* THE MIRRORED DIAGONALS (P8.6 / D-77). The translate sits AFTER the counter-rotation in
					   the transform list, so it is applied in the plate's own counter-rotated space — which
					   is parallel to the screen by construction. A pure screen-space slide: it cannot
					   keystone, crop or clip the photograph, by the same geometry that already guaranteed
					   translateZ and scale could not. */
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
					// Every word stays legible at every angle — a previous pass dimmed the unattended caption
					// to 32% and the render became ambiguous about which words belonged to which photograph.
					if (p.shade) p.shade.style.opacity = (0.44 * (1 - look)).toFixed(3);
					if (p.copy) p.copy.style.opacity = (0.6 + 0.4 * look).toFixed(3);
				}
			}

			if (desktop) {
				gsap.set(spread, { perspective: PERSPECTIVE, perspectiveOrigin: '50% 50%' });
				gsap.set(pair, { transformStyle: 'preserve-3d' });
				gsap.set(
					plates.map((p) => p.el),
					{ transformStyle: 'preserve-3d' }
				);

				spreadST = ScrollTrigger.create({
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
					scrub: 0.5,
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
				applyTurn();
			} else {
				/* MOBILE. One column, both photographs full width, no pin and no 3D: a rotation about a
				   vertical axis is meaningless when the plates are stacked, and at 390px any lateral travel
				   pushes a full-width photograph toward an edge. Mobile gets the same ATTENTION language
				   expressed vertically — each plate lights as it reaches the middle of the screen. The room
				   itself (jambs, streaming floor and ceiling, the colour drain) runs in full. Complete, not
				   identical (blueprint 7.127–7.129). */
				/* P8.5 (D-76): the same "one at a time" statement, expressed vertically, matched to the
				   desktop depth. Held to 0.5 rather than the architectuur page's 0.7 for the same reason the
				   desktop shade is: these are black-and-white photographs, where heavy shade reads as murk. */
				for (const p of plates) {
					gsap.timeline({
						defaults: { ease: 'none' },
						scrollTrigger: { trigger: p.el, start: 'top 86%', end: 'center 46%', scrub: 0.8 },
					})
						.fromTo(p.shade, { opacity: 0.5 }, { opacity: 0, ease: 'power2.out' }, 0)
						.fromTo(p.copy, { autoAlpha: 0.36 }, { autoAlpha: 1, ease: 'power2.out' }, 0);
				}
			}

			/* ═══ THE REST OF THE WALK — the three beats after the spread ═════════════════════════════
			   The world already changed across these (D-54's four differently-lit rooms). What it did NOT
			   have was a CAMERA: the rooms lit and dimmed around content that sat perfectly still, so the
			   reader's own experience was of scrolling a document through a nice background. A world that
			   moves while the content does not is a backdrop, not a place.

			   Each beat gets its own verb, and none of them is the architectuur page's. That page CRANES
			   past a wall, DESCENDS past markers and SETTLES. This one is indoors and moving forward, so:
			   it DRIFTS ALONG a wall (lateral, not vertical), it WALKS PAST lamps (light travelling with
			   the reader rather than depth), and it STEPS OUT (the space opening rather than the camera
			   coming to rest). Same filmmaker, different building. */

			/* ── UITLEG — THE DRIFT ALONG THE WALL.
			   Indoors you do not crane over things; you move ALONGSIDE them. So this beat's parallax is
			   LATERAL-dominant: the body copy is the near surface and slides a real distance across the
			   view, while the toepassingen index is further along the wall and barely shifts. The vertical
			   term is deliberately small — it is the difference between walking past a wall and flying
			   over one, and it is the whole reason this does not read as the architectuur page's crane. */
			const uitTextEl = uitleg && uitleg.querySelector('.svc-scope__text');
			const uitAsideEl = uitleg && uitleg.querySelector('.svc-scope__aside');
			if (uitleg && uitTextEl && uitAsideEl) {
				const drift = gsap.timeline({
					defaults: { ease: 'none', force3D: true },
					scrollTrigger: { trigger: uitleg, start: 'top bottom', end: 'bottom top', scrub: 0.85 },
				});
				drift.fromTo(uitTextEl, { x: 34 * A, y: 20 * A }, { x: -14 * A, y: -20 * A, duration: 1 }, 0);
				drift.fromTo(uitAsideEl, { x: 9 * A, y: 7 * A }, { x: -4 * A, y: -7 * A, duration: 1 }, 0);
			}

			/* ── DE WERKWIJZE — WALKING PAST THE LAMPS.
			   The architectuur page descends past three markers set into a wall. Here the reader walks a
			   corridor, and what a corridor gives you is LIGHT ARRIVING AND LEAVING: each step brightens
			   as you come level with it and falls back as you pass. `--lamp` is the light on THIS step;
			   the row's own numeral and rule read it, so the LIGHT is what travels, not the element.
			   Nothing translates far enough to be watched, nothing arrives, nothing has "happened" — and
			   scrolling back up walks you back past the same lamps in the same order. */
			const seqItems = seq ? [...seq.querySelectorAll('.svc-seq__item')] : [];
			if (seq && seqItems.length) {
				const corridor = gsap.timeline({
					defaults: { ease: 'none' },
					scrollTrigger: { trigger: seq, start: 'top 72%', end: 'bottom 78%', scrub: 0.9 },
				});
				seqItems.forEach((row, i) => {
					const at = 0.06 + i * 0.24;
					corridor
						.fromTo(row, { '--lamp': 0.3 }, { '--lamp': 1, duration: 0.22 }, at)
						.to(row, { '--lamp': 0.52, duration: 0.34 }, at + 0.22);
					// A short lateral pass with the light, so the reader is moving rather than watching a
					// row light up in place. Small on purpose: at this distance the wall is close.
					corridor.fromTo(row, { x: 22 * A }, { x: -22 * A, duration: 1 }, 0);
				});
			}

			/* ── RELEVANTE PROJECTEN — STEPPING OUT.
			   The architectuur page decelerates into stillness here. This page does the opposite, because
			   its film is a walk out of an enclosed building: the work arrives as the space OPENS. The
			   whole beat comes forward on a uniform scale — never a crop, never a non-uniform stretch —
			   so what changes is the reader's distance from it, not the photographs' geometry. */
			const relHeadEl = rel && rel.querySelector('.rel__head');
			const relItemEls = rel ? [...rel.querySelectorAll('.rel__item')] : [];
			if (rel && relItemEls.length) {
				const out = gsap.timeline({
					defaults: { force3D: true },
					scrollTrigger: { trigger: rel, start: 'top bottom', end: 'center 44%', scrub: 1 },
				});
				if (relHeadEl) out.fromTo(relHeadEl, { y: 26 * A }, { y: 0, ease: 'power2.out', duration: 1 }, 0);
				relItemEls.forEach((item, i) => {
					out.fromTo(
						item,
						{ y: 64 * A, scale: 1 - 0.035 * A },
						{ y: 0, scale: 1, ease: 'power2.out', duration: 1 },
						i * 0.07
					);
				});
			}

			ScrollTrigger.refresh();

			return () => {
				gsap.ticker.remove(update);
				ScrollTrigger.removeEventListener('refresh', refreshMetrics);
				docEl.classList.remove('motion-scene');
			};
		}
	);

	window.addEventListener('pagehide', () => mm.revert(), { once: true });
}
