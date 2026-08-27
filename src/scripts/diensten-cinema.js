/*
 * diensten-cinema.js — MOVEMENT I, re-directed again (P7.4 / D-52). The camera travels; the photograph AND
 * its words travel with it, as one scene.
 *
 * WHY THIS FILE WAS REWRITTEN AGAIN, AND WHAT SURVIVES. D-51 obeyed the absolute rule (the photograph is never
 * cropped, masked, stretched or feathered) by pinning the photograph ALONE and delivering its caption as a
 * SEPARATE dark beat below. The owner's verdict: that separation re-created the document feeling — "text ↓
 * photo ↓ text", a photograph and then, later, some words, never one place you arrive in. And the movement was
 * a scale: the photograph mainly changed SIZE ("the image became larger"), not a camera travelling through a
 * space ("I travelled somewhere"). Two root causes, both now removed:
 *   1. THE SPLIT SCENE. A photograph pinned alone, then its text as a second beat, is two things, not one.
 *      D-52 rebuilds each discipline as ONE editorial scene — a complete photograph and its caption sharing the
 *      frame — and moves them TOGETHER (`.room__camera` is the single translated unit). You never wonder which
 *      words belong to which photograph, because they are never apart.
 *   2. SCALE AS THE VERB. D-51's camera was a dolly (scale 0.9 → 1.0) with a ±3% drift. D-52 inverts that:
 *      TRANSLATION is the verb (a diagonal camera pan across the space), and scale is demoted to a whisper of
 *      depth. You feel a lateral journey, not a zoom.
 *
 * THE FILM (§10's three questions, answered from the two photographs, not from the homepage):
 *   SENTENCE  — "You are inside a dark interior. Two spaces open off it, in different directions. You travel to
 *                each in turn — the camera swinging down-and-left to the first, down-and-right to the second —
 *                the room's light comes up, and the space and its name resolve together; then the room lets you
 *                go and the dark returns before the next."
 *   THE HOUR  — interior night, no light of its own. The two photographs ARE the light and they are opposites,
 *                read straight off the frames (§5.2/§5.3): the cube houses are a star of hard sky seen from
 *                below — cool light from BEYOND, so the room floods from high-left; the staircase is a gold
 *                helix glowing under each tread — warm light from WITHIN, so it pools low-right. High-flooding-
 *                cool vs low-pooling-warm: the comparison the page exists to make (13.39), and the reason the
 *                two rooms can never feel like one beat twice.
 *   MECHANISM — THE CAMERA TRAVELS ON A DIAGONAL; THE PHOTOGRAPH DOES NOT DEFORM. The whole scene (a complete,
 *                rigid photograph + its caption) is panned diagonally into place and settles; the room's light
 *                rises on it; the caption resolves out of the dark on a timing directed PER SCENE (arch: the
 *                NAME leads, then the photograph comes to light, then the description; interieur: the
 *                PHOTOGRAPH leads, then the name, then the description). Every frozen frame is therefore a whole
 *                photograph and its words in a lit room, seen mid-travel — a portfolio frame by construction.
 *                The two headings differ (down-left, then down-right), so scrolling stops feeling vertical and
 *                starts feeling like walking through two connected spaces.
 *
 * WHY IT IS NOT A COPY OF THE HOMEPAGE (§11.1). Shared, deliberately: the fixed `.stage` world (opacity/
 * transform only), scrub 0.8, native scroll, pin discipline, `power2.out` arrivals, the honest baseline. This
 * page's own FUNCTION: the homepage DESCENDS (one monotone fall through hours, the camera always going down);
 * this room TRAVELS SIDEWAYS to two arrivals on opposite diagonals with a true dark between. Descent vs lateral
 * traverse — you cannot reach one from the other.
 *
 * CLIP-SAFETY (the absolute rule, made structural). The photograph is sized (arrivalWidth) to sit inside its
 * grid column with margin to spare, and it lives on the side the camera departs TOWARD, so the entering shift
 * always moves it toward centre, never toward the near edge. Every translation amplitude is small next to that
 * margin. The pinned section is `overflow: clip` only as a backstop; by construction no edge ever reaches the
 * photograph. Only opacity + transform are ever written per frame.
 *
 * PROGRESSIVE ENHANCEMENT (§P13). Runs only under `prefers-reduced-motion: no-preference`. Under reduce / no-JS
 * `motion-scene` is never set, the stage stays invisible, and the page renders as a calm static composition of
 * two COMPLETE editorial spreads with full copy and real links — a first-class render.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrubFor, COARSE_QUERY } from './scroll-weight.js';
import { clamp01, lerp } from './motion-math.js';

export function initDienstenCinema() {
	if (typeof window === 'undefined' || !window.matchMedia) return;
	const docEl = document.documentElement;
	const stage = document.querySelector('.stage');
	if (!stage) return;

	const cool = stage.querySelector('.stage__sky--cool');
	const warm = stage.querySelector('.stage__sky--warm');
	const shaft = stage.querySelector('.stage__shaft');
	const haze = stage.querySelector('.stage__haze');
	const vig = stage.querySelector('.stage__vignette');

	// Each room: the section (pin trigger + clip stage), the camera (the single translated unit — photograph
	// AND caption together), the frame (the complete photograph — dolly + parallax on top of the camera pan),
	// the shade (the reveal), and the two caption groups (head = eyebrow + name; body = description + for +
	// link) so the arrival can be directed differently per scene.
	const rooms = ['arch', 'int'].map((k) => {
		const el = document.querySelector('.room--' + k);
		if (!el) return null;
		const copy = el.querySelector('.room__copy');
		return {
			key: k,
			el,
			camera: el.querySelector('.room__camera'),
			frame: el.querySelector('.room__frame'),
			shade: el.querySelector('.room__shade'),
			copy,
			head: copy ? copy.querySelectorAll('.room__eyebrow, .room__name') : [],
			body: copy ? copy.querySelectorAll('.room__desc, .room__for, .room__link') : [],
		};
	}).filter(Boolean);
	if (rooms.length < 2) return;
	const [roomI, roomII] = rooms;

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
			// Reduced motion: build nothing. The honest static composition renders; the stage stays inert.
			if (!motion) {
				docEl.classList.remove('motion-scene');
				return;
			}

			gsap.registerPlugin(ScrollTrigger);

			// Amplitude scaling — gentler on mobile (blueprint 7.127-7.129). Mobile is a COMPLETE experience,
			// not a reduced desktop fallback: both rooms still light and reveal; what it drops is the weight of
			// the pins (§9.4).
			const A = desktop ? 1 : 0.62;

			let vw = docEl.clientWidth; // layout width (never innerWidth — that counts the scrollbar).
			let vh = window.innerHeight;
			let maxScroll = Math.max(1, docEl.scrollHeight - vh);

			/* THE ARRIVAL SIZE OF EACH PHOTOGRAPH — the no-crop / no-upscale guarantee, and the margin the
			   diagonal travel spends. The photograph is `contain`ed, so the 1700px source ceiling is headroom,
			   not a wall. The arrival width is the LARGEST that (a) fits its grid column (~58% of the inner
			   width) with room to spare, (b) leaves a healthy vertical margin inside the 100svh scene so the
			   camera's vertical travel never pushes an edge past the viewport, and (c) never exceeds the file's
			   native width. The camera then only ever scales it a hair below/around native, so a whole
			   photograph is complete and at-or-below native resolution at every scroll position. */
			function arrivalWidth(r) {
				const natW = +r.frame.dataset.w || 1700;
				const natH = +r.frame.dataset.h || 1133;
				const byColumn = vw * 0.5; // fits the photograph's ~52vw grid column with room for the pan.
				const byHeight = vh * 0.62 * (natW / natH); // 0.62vh tall cap → generous vertical margin.
				return Math.round(Math.min(byColumn, byHeight, natW));
			}
			function sizeFrames() {
				rooms.forEach((r) => {
					if (r.frame) r.frame.style.setProperty('--frame-w', arrivalWidth(r) + 'px');
				});
			}

			function refreshMetrics() {
				vw = docEl.clientWidth;
				vh = window.innerHeight;
				maxScroll = Math.max(1, docEl.scrollHeight - vh);
				sizeFrames();
			}

			/* Each room's light, read LIVE off its photograph's position in the viewport — robust against
			   pinning (a pinned scene reports a stable rect while you stand in it). Full when the photograph is
			   centred; falls to 0 as it leaves. The two scenes are far enough apart that between them neither is
			   near and the room is genuinely dark — "the dark between", by construction, at any viewport. */
			function roomLight(frame) {
				if (!frame) return 0;
				const b = frame.getBoundingClientRect();
				const dist = Math.abs(b.top + b.height / 2 - vh / 2);
				return clamp01(1 - Math.max(0, dist - vh * 0.14) / (vh * 0.8));
			}

			/* ---- THE WORLD (one update, every frame) --------------------------------------------------
			   Only opacity + transform writes — no gradient repaint, CLS-safe. The light is the narrative; the
			   dark is what is left when no room is near. The shaft and haze rake DIAGONALLY toward whichever
			   room is near, so the world itself leans in the direction the camera is travelling. */
			function update() {
				const t = gsap.ticker.time;

				const lI = roomLight(roomI.frame);
				const lII = roomLight(roomII.frame);
				cool.style.opacity = (lI * 0.9).toFixed(3);
				warm.style.opacity = (lII * 0.8).toFixed(3);

				const near = Math.max(lI, lII);
				const warmth = lII / (lI + lII + 0.0001); // 0 = cool room near, 1 = warm room near.

				// The shaft rakes across, and its heading FLIPS between the rooms: it leans down-left toward the
				// cool room (roomI's diagonal) and down-right toward the warm room (roomII's) — the angle of
				// light on a wall changing as you travel past its source. Lean = -1 (left) at the cool room,
				// +1 (right) at the warm room, with a slow breath so it lives at rest.
				const lean = lerp(-1, 1, warmth);
				const shx = lean * 4 + Math.sin(t * 0.13) * 1.4 * A;
				const shy = lean * 2.4; // a genuine vertical component → the rake is diagonal, not horizontal.
				shaft.style.transform =
					'translate3d(' + shx.toFixed(2) + '%,' + shy.toFixed(2) + '%,0)';
				shaft.style.setProperty('--warm', warmth.toFixed(3));
				shaft.style.opacity = (near * 0.6).toFixed(3);

				// Air — a soft depth plane that drifts diagonally and rises slower than scroll (parallax depth),
				// leaning the same way as the shaft so the whole atmosphere moves with the camera's heading.
				const p = clamp01(window.scrollY / maxScroll);
				const hx = lean * 2.6 + Math.sin(t * 0.11) * 1.8 * A;
				const hy = lerp(6, -10, p);
				haze.style.transform = 'translate3d(' + hx.toFixed(2) + '%,' + hy.toFixed(2) + 'vh,0)';

				// The dark between, made structural — the inverse of the light. The passage between the two
				// rooms visibly closes in as you cross it, and opens again as the next room's light arrives.
				vig.style.opacity = (0.24 + 0.5 * (1 - near)).toFixed(3);
			}

			// Seed the world at the reader's current altitude and reveal it BEFORE flagging motion-scene, so the
			// honest static composition hands off onto an already-lit room (no flash of flat ink).
			refreshMetrics();
			update();
			docEl.classList.add('motion-scene');
			gsap.ticker.add(update);
			ScrollTrigger.addEventListener('refresh', refreshMetrics);

			/* ---- A ROOM YOU TRAVEL TO ------------------------------------------------------------------
			   One pinned scene per discipline. The camera (photograph + caption, one unit) is discovered off to
			   one side and high, then TRAVELS on a diagonal into place and settles; the room's light comes up on
			   it; the caption resolves out of the dark on a per-scene timing. It then HOLDS with an imperceptible
			   continued drift on its heading (never a frozen frame), and the pin RELEASES to native scroll — the
			   camera simply carries on (no exit choreographed inside the pin, §4.4).

			   `dir` is the heading. 'left' = the camera pulls DOWN-LEFT (enters shifted up-and-right, with the
			   photograph on the left so the shift moves it toward centre); 'right' mirrors. The two opposite
			   headings are what make the traverse feel like walking between two connected spaces. `lead` directs
			   which resolves first — 'name' (the title leads, arch) or 'photo' (the photograph leads, interieur). */
			function directRoom(r, { dir, lead }) {
				const { el, camera, frame, shade, head, body } = r;
				if (!el || !camera || !frame) return;
				gsap.set(camera, { transformOrigin: '50% 50%', force3D: true });
				gsap.set(frame, { transformOrigin: '50% 50%', force3D: true });

				const sign = dir === 'left' ? 1 : -1; // enter shifted right (+) for the down-left pull; mirror.
				const enterX = 8 * sign; // camera pan, horizontal — xPercent ≈ vw. The lateral journey, felt.
				const enterY = -16; // camera pan, vertical — enters HIGH, travels down. The dominant amount.
				const holdX = -2 * sign; // the imperceptible continued pan, on the heading.
				const holdY = 4;

				if (!desktop) {
					// Mobile — no pin, and NO horizontal drift: the photograph runs edge-to-edge here, so any
					// lateral camera pan would push it past an edge and clip it (the absolute rule). The scene
					// reveals vertically instead — the shade lifts and it settles the last of the way up — and the
					// caption is simply present below. Gentle, complete, readable; the world's light still arrives
					// by scroll position above.
					gsap.set(camera, { yPercent: -4 });
					gsap.timeline({
						defaults: { ease: 'none' },
						scrollTrigger: { trigger: el, start: 'top 80%', end: 'center center', scrub: scrubFor(0.8, coarse) },
					})
						.fromTo(shade, { opacity: 0.5 }, { opacity: 0 }, 0)
						.fromTo(camera, { yPercent: -4 }, { yPercent: 0 }, 0);
					return;
				}

				/* Desktop — the pinned diagonal travel. TRANSLATION dominates: the camera pans enterX/enterY →
				   0 (a real lateral+vertical journey), while the photograph adds only a whisper of dolly-scale
				   (0.94 → 1.0) and a touch of extra vertical parallax, so it reads as depth, never as a zoom.

				   P8.5 (D-76) — THE SCENE IS SHORTER AND LIGHTER ON THE HAND. The owner's report is that this
				   page is "stroef" and scrolls too long, and both are the same two numbers:
				     · `end: '+=128%'` meant each room held the page still for 1.28 EXTRA viewports before it
				       let go — 2.56 viewports of pin across the two rooms, on a document that measured 6.28
				       screens in total. A pinned scene is, by definition, scrolling that produces no scrolling;
				       past a certain length that stops reading as a held moment and starts reading as
				       resistance. 70% keeps the whole travel + hold intact (nothing is cut from the film — the
				       same timeline plays over a shorter distance) and returns ~1.16 viewports to the page.
				     · `scrub: 0.8` is 800ms of catch-up. Inside a pin, that lag is the entire perceptual
				       signal: you move, and the world answers almost a second later. 0.45 stays smooth enough
				       to absorb wheel-step quantisation while answering the hand immediately.
				   Both are timing, not choreography: the diagonal, the dolly, the per-scene lead and the hold
				   are unchanged. */
				const tl = gsap.timeline({
					defaults: { ease: 'none' },
					scrollTrigger: {
						trigger: el,
						start: 'top top',
						end: '+=70%',
						scrub: scrubFor(0.45, coarse),
						pin: true,
						pinSpacing: true,
						fastScrollEnd: true,
					},
				});

				// THE TRAVEL — the camera swings in on its diagonal and decelerates INTO place (power2.out = an
				// arrival, not a mechanical move). The photograph and its caption move together: one place.
				tl.fromTo(
					camera,
					{ xPercent: enterX, yPercent: enterY },
					{ xPercent: 0, yPercent: 0, ease: 'power2.out', duration: 0.55 },
					0
				)
					// THE DOLLY + PARALLAX (secondary) — the photograph comes forward a hair (0.94 → 1.0) and
					// rises a touch more than the caption, so photograph and words sit on two depth planes.
					.fromTo(
						frame,
						{ scale: 0.94, yPercent: 6 },
						{ scale: 1, yPercent: 0, ease: 'power2.out', duration: 0.55 },
						0
					)
					// THE HOLD — an imperceptible continued pan on the heading, so the frame is never frozen
					// under active scroll, and a matching breath of dolly. No exit: the pin releases to native
					// scroll and the camera carries on.
					.to(camera, { xPercent: holdX, yPercent: holdY, duration: 0.45 }, 0.55)
					.to(frame, { scale: 1.02, duration: 0.45 }, 0.55);

				/* THE REVEAL and THE CAPTION, directed per scene. The photograph's light (the shade lifting) and
				   the caption groups resolve in an order set by `lead`: arch reads NAME-first (you learn where
				   you are, then the space comes to light), interieur reads PHOTOGRAPH-first (the warm space
				   arrives, then it is named). Nothing is ever fully hidden (from 0.28 / a whisper of shade), so a
				   paused mid-travel frame is a caption coming out of shadow, not a blank — and it is a scrubbed
				   clarify tied 1:1 to scroll, reversible, never an assemble-on-arrival fade (§3.1.3).

				   P8.5 (D-76) — TEXT AND PHOTOGRAPH NOW LAND TOGETHER. The camera arrives at 0.55, but the copy
				   used to be laid out across 0.05→0.92: the description was still resolving a third of the
				   scene AFTER the photograph had settled and begun its hold. MEASURED on the render — with the
				   photograph fully lit and square, the "Voor architecten…" line was still visibly under-opaque.
				   That desync is what "tekst en foto's niet synchroon" describes, and it also made the beat feel
				   longer than it is, because the scene is not finished until the last word is.
				   The whole caption is now placed INSIDE the camera's own travel and every group lands at or
				   before 0.55. The per-scene ORDER is untouched — that is the direction, and the direction was
				   never the problem; only the tail was. */
				const t =
					lead === 'name'
						? { head: 0.0, shade: 0.1, body: 0.18 }
						: { shade: 0.0, head: 0.12, body: 0.2 };

				tl.fromTo(shade, { opacity: 0.72 }, { opacity: 0, ease: 'power2.out', duration: 0.44 }, t.shade);
				if (head.length) {
					tl.fromTo(
						head,
						{ autoAlpha: 0.28, yPercent: 40 },
						{ autoAlpha: 1, yPercent: 0, ease: 'power2.out', duration: 0.4, stagger: 0.04 },
						t.head
					);
				}
				if (body.length) {
					tl.fromTo(
						body,
						{ autoAlpha: 0.22, yPercent: 26 },
						{ autoAlpha: 1, yPercent: 0, ease: 'power2.out', duration: 0.35, stagger: 0.05 },
						t.body
					);
				}
			}

			directRoom(roomI, { dir: 'left', lead: 'name' }); // arch — down-left; the name leads.
			directRoom(roomII, { dir: 'right', lead: 'photo' }); // interieur — down-right; the photograph leads.

			ScrollTrigger.refresh();

			return () => {
				gsap.ticker.remove(update);
				ScrollTrigger.removeEventListener('refresh', refreshMetrics);
				docEl.classList.remove('motion-scene');
			};
		}
	);

	// Backstop: kill everything defensively on a full-page unload (no leaks).
	window.addEventListener('pagehide', () => mm.revert(), { once: true });
}
