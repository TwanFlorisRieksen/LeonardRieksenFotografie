/*
 * home-cinema.js — HOMEPAGE cinematic descent (P6.2 / D-41 — creative-direction reset).
 *
 * WHAT CHANGED vs D-40, and WHY. The owner reviewed the real D-40 runtime and judged it product-level
 * unsuccessful: it still read as "a traditional website with animations / secties met animaties", not a
 * premium cinematic experience. Root causes (diagnosed, not defended):
 *   1. The "continuous world" was 4 low-alpha radial gradients behind near-black content — imperceptible.
 *      The unifying device did NO unifying work; the eye saw dark block, dark block, dark block.
 *   2. The per-block reveal cadence (fade/rise/mask-in on arrival) IS the "section ↓ section" feeling.
 *   3. Nothing crossed the boundaries: every photo belonged to one block and scrolled away; hard cuts.
 *
 * THE RESET. The homepage is not a page you scroll down — it is ONE continuous descent at dusk, from the
 * open blue-hour sky (hero) down past the architecture, into warm interior light, landing in the deep warm
 * dark where you make contact. Scroll is a CAMERA DESCENDING, not a scrollbar. Three load-bearing devices:
 *   A. A genuinely VISIBLE descending environment — a real, chromatic (but dark) sky that unmistakably
 *      evolves blue-hour → deep night → warm interior as you fall, with a horizon that rises past you and
 *      atmospheric haze for depth. Bold in the negative space, hidden behind full-bleed photography, so the
 *      photographs stay dominant. This is the connective tissue the D-40 whisper failed to be.
 *   B. Pinned cinematic moments (owner-approved) — the viewport HOLDS while scroll drives a transformation
 *      in place, so you travel THROUGH rather than scroll PAST. Native scroll; the reader keeps full control
 *      (no velocity override, no snap — this is pinning, not hijacking; blueprint 7.30 respected).
 *   C. Photography that participates — the hero dissolves into the sky it becomes; the featured plate expands
 *      to full-bleed and recedes. The section-label drumbeat is gone; scale + arrival announce each beat.
 *
 * Tooling: GSAP + ScrollTrigger (kept from D-39/D-40). NO Lenis (native scroll; no hijack — blueprint 7.30).
 *
 * Progressive enhancement / restraint (blueprint 7.114-7.117 / 7.151#24 / MOT-07/08):
 *   - Runs ONLY under `prefers-reduced-motion: no-preference`. Under `reduce` nothing initialises,
 *     `html.motion-scene` is never set, the stage stays inert and the honest stacked composition renders.
 *   - Without JS the module never loads: same honest composition, all content visible, all links real.
 *   - The environment writes only layer OPACITY + TRANSFORM (compositor-only, no gradient repaint, CLS-safe).
 *     Photography moves only via overscanned drift/scale — never crop/rotate/skew. The LCP hero image is
 *     eager/priority and is never gated by this module.
 *   - Desktop gets the full system; mobile (<=52rem) gets gentler amplitudes + no heavy pins.
 *   - All tweens/triggers/ticker live inside the matchMedia context, so a reduced-motion toggle or a
 *     breakpoint cross auto-reverts them (no leaks); a pagehide backstop kills anything remaining.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrubFor, COARSE_QUERY } from './scroll-weight.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// Smoothstep — eases the environment blends so the descent settles into each altitude rather than tracking
// scroll perfectly linearly (an "arrival" feel).
const smooth = (t) => {
	t = clamp01(t);
	return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
// A soft hump centred at `c` with half-width `w` — used to deepen the vignette AS the camera passes a room.
const bump = (p, c, w) => {
	const d = Math.abs(p - c) / w;
	return d >= 1 ? 0 : (1 - d * d) * (1 - d * d);
};

export function initHomeCinema() {
	if (typeof window === 'undefined' || !window.matchMedia) return;
	const docEl = document.documentElement;
	const stage = document.querySelector('.stage');
	if (!stage) return;

	const skyA = stage.querySelector('.stage__sky--a'); // blue hour (dominant at the top)
	const skyC = stage.querySelector('.stage__sky--c'); // warm interior night (dominant at the foot)
	const horizon = stage.querySelector('.stage__horizon');
	const haze = stage.querySelector('.stage__haze');
	const vig = stage.querySelector('.stage__vignette');
	const lumen = document.querySelector('.home-hero__lumen');

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
			// Reduced motion: build nothing; the honest stacked composition renders and the stage stays inert.
			if (!motion) {
				docEl.classList.remove('motion-scene');
				return;
			}

			gsap.registerPlugin(ScrollTrigger);

			/* A NOTE ON `anticipatePin`, since its removal looks like a downgrade and is not.
			   Both pins previously carried `anticipatePin: 1`. It exists to cure pinned elements that flash
			   or vibrate on fast scroll, and it works by engaging the pin EARLY in proportion to scroll
			   velocity — it trades a flash for a jump. Measured here, that trade was pure loss: the plate
			   snapped into place 3px early at a crawl, 35px at reading speed, and 63px at speed (rect top
			   153→0 in a single frame) — a hitch exactly where the reader should feel nothing, the arrival
			   announcing that a pin had started. And the flash it insures against does not occur in this
			   setup: swept at a brutal 150px/frame, both pins hold their element at top 0 for every frame
			   inside the pin range (0 deviating frames). Removed: entry hitch 35px → 0px at reading speed,
			   no flash introduced. Re-add it only against a MEASURED flash, never prophylactically. */

			// Amplitude scaling — gentler descent + breath on mobile (blueprint 7.127-7.129), full on desktop.
			const A = desktop ? 1 : 0.6;

			let vh = window.innerHeight;
			let maxScroll = Math.max(1, docEl.scrollHeight - vh);
			function refreshMetrics() {
				vh = window.innerHeight;
				maxScroll = Math.max(1, docEl.scrollHeight - vh);
			}

			/* ---- THE DESCENDING ENVIRONMENT (one update, every frame) ----------------------------------
			   p = 0 at the top of the page, 1 at the very bottom — the camera's ALTITUDE. Everything is a
			   function of p (where the reader is) plus a slow autonomous breath (so the world lives at rest).
			   Only opacity/transform/custom-property writes — no layout reads, no gradient repaints. --- */
			function update() {
				const t = gsap.ticker.time;
				const p = clamp01(window.scrollY / maxScroll);

				// Sky blend — blue hour fades out over the first ~40% of the descent; the warm interior fades
				// in over the last ~50%; the deep-night base (skyB, opacity:1 in CSS) is what shows between.
				skyA.style.opacity = (1 - smooth(p / 0.42)).toFixed(3);
				skyC.style.opacity = smooth((p - 0.5) / 0.5).toFixed(3);

				// Horizon glow — the band of last light. It RISES past the camera as we descend (translateY
				// from low to high = a genuine sense of falling THROUGH space, not just recolouring), breathes
				// slowly, and shifts cool→warm. Strong at the hero, dimming into the fall, a warm return low.
				const warm = smooth((p - 0.5) / 0.5);
				const hy = lerp(16, -34, p) + Math.sin(t * 0.3) * 1.1 * A;
				horizon.style.transform = 'translate3d(0,' + hy.toFixed(2) + 'vh,0)';
				horizon.style.opacity = (0.85 * (1 - smooth((p - 0.12) / 0.46)) + 0.32 * warm).toFixed(3);
				horizon.style.setProperty('--warm', warm.toFixed(3));

				// Atmospheric haze — a soft depth plane that drifts laterally + rises slower than scroll (parallax
				// depth). Keeps the air alive without any busy motion.
				const hx = Math.sin(t * 0.16) * 2.2 * A;
				const hhy = lerp(8, -16, p);
				haze.style.transform =
					'translate3d(' + hx.toFixed(2) + '%,' + hhy.toFixed(2) + 'vh,0)';

				// Depth vignette — deepens AS the camera passes the gallery (the abyss the plate emerges from)
				// and again as it lands in the deep footer dark.
				const vg = 0.22 + 0.5 * Math.max(bump(p, 0.36, 0.16), smooth((p - 0.72) / 0.28));
				vig.style.opacity = vg.toFixed(3);

				// Hero living water-light — drift + breath of Leo's reflected window-lights on the still water,
				// so the establishing shot keeps a cinematic presence at rest.
				// On DESKTOP the pinned scene's exchange takes this layer out with the photograph
				// (`set([heroMedia, heroScrim, heroLumen], autoAlpha:0)`), so it needs nothing here. MOBILE has
				// no such exchange, so the water-light is faded out with the water it models — otherwise it
				// outlives the shot as a warm bloom hanging over an empty hero box. Driven here off `--lo`
				// rather than as a tween on `opacity`, deliberately: this element's opacity is already owned by
				// the 1.4s intro tween below, and a second tween on the same property would fight it for the
				// opening seconds. Amplitude only — no new movement, and it cannot darken anything (the layer
				// is `mix-blend-mode: screen`, so it only ever adds light).
				if (lumen) {
					const heroLight = desktop ? 1 : clamp01(1 - window.scrollY / (vh * 0.7));
					lumen.style.setProperty('--lx', (50 + Math.sin(t * 0.33) * 7).toFixed(1) + '%');
					lumen.style.setProperty(
						'--lo',
						((0.11 + Math.sin(t * 0.55) * 0.05) * heroLight).toFixed(3)
					);
				}
			}

			// Seed the world at the hero altitude and reveal it BEFORE flagging `.motion-scene`, so the honest
			// per-section fills fade out onto an already-lit sky (no flash of flat ink).
			refreshMetrics();
			update();
			docEl.classList.add('motion-scene');
			if (lumen) gsap.to(lumen, { opacity: 1, duration: 1.4, delay: 0.3, ease: 'power1.out' });

			gsap.ticker.add(update);
			ScrollTrigger.addEventListener('refresh', refreshMetrics);

			/* ---- SCENE 1 · THE HERO DISSOLVES INTO THE SKY --------------------------------------------
			   The single most important cut on the page was hero → positionering: a self-contained 100vh photo
			   box, then a new section. Here the establishing shot instead HOLDS (pinned) and, as you begin to
			   descend, the photograph slowly pushes in and DISSOLVES — revealing the blue-hour sky (the fixed
			   stage) it becomes. The title lifts away (it has been read). At unpin you are already falling
			   through open sky, and the positionering title-card rises out of that same sky: no seam, one world.
			   Native scroll + pin (reader keeps full control — pinning, not hijacking; blueprint 7.30). Desktop
			   only; mobile gets a lighter non-pinned dissolve (7.127-7.129). The LCP hero is eager/priority and
			   is never gated by this. --- */
			const hero = document.querySelector('.home-hero');
			const heroMedia = document.querySelector('.home-hero__media');
			const heroScrim = document.querySelector('.home-hero__scrim');
			const heroContent = document.querySelector('.home-hero__content');
			const heroLumen = document.querySelector('.home-hero__lumen');
			const heroDusk = document.querySelector('.home-hero__dusk');
			if (hero && heroMedia) {
				// Origin biased HIGH (into the photograph's own dusk sky) so the forward push settles the camera
				// into the sky while the water + houses drift down and out — a descent, not a centred zoom.
				gsap.set(heroMedia, { transformOrigin: '50% 32%', force3D: true });
				if (desktop) {
					const tl = gsap.timeline({
						defaults: { ease: 'none' },
						scrollTrigger: {
							trigger: hero,
							start: 'top top',
							end: '+=86%',
							scrub: scrubFor(0.8, coarse),
							pin: true,
							pinSpacing: true,
							fastScrollEnd: true,
						},
					});
					// The camera drifts FORWARD and decelerates (power1.out — a settle, not a mechanical zoom).
					// 1.28, not 1.10: the old travel was too small to register as a camera at all, so the beat
					// read as a still photograph having an effect applied to it rather than a shot being pushed.
					// At 1440 the browser serves the 1920w source, so even at full push it renders BELOW native
					// resolution — the photograph is never upscaled. Explicit fromTo pins the scroll-start scale
					// at 1, so the frozen rest composition is byte-for-byte what it always was.
					tl.fromTo(
						heroMedia,
						{ scale: 1, yPercent: 0 },
						{ scale: 1.28, yPercent: -3, ease: 'power1.out', duration: 1 },
						0
					)
						// THE NIGHT RISES — the single storytelling device of this scene, and a transform, never
						// an opacity (owner: "the photograph should continue existing in another form... do NOT
						// solve this with opacity"). One unbroken linear translate carries the band of deep night
						// (see `.home-hero__dusk`) from below the frame, up through the photograph — the still
						// water goes under first, then the houses, then its blue-hour sky — and onward past the
						// camera, uncovering the open stage sky from the bottom as it clears. The photograph is
						// consumed by the descending world; it does not dim.
						// `y: 0` is load-bearing: the CSS rest state is `transform: translateY(100%)` (so no-JS and
						// reduced motion park the band below the frame without needing this module), and GSAP
						// parses that existing transform into its own `y` in PIXELS — then adds `yPercent` on
						// top of it. Without zeroing `y` the band sits one full band-height too low, never
						// enters the frame, and the exchange below fires over a photograph in plain view.
						.fromTo(
							heroDusk,
							{ yPercent: 100, y: 0 },
							{ yPercent: -40, y: 0, ease: 'none', duration: 1 },
							0
						)
						// THE EXCHANGE. Geometry (band ≈1.33 hero-heights of solid, travelling 100 → −40) puts the
						// frame under total occlusion for progress ≈ 0.52–0.61; 0.56 is dead centre of that
						// window, so the swap from photograph to sky lands on a frame where there is, literally,
						// nothing on screen to see it happen. No dissolve is needed because nothing is visible to
						// dissolve — and the hero box therefore hands off completely transparent at unpin, with no
						// dark rectangle left to scroll away against the sky.
						// Both this and the band read the SAME timeline playhead, so they cannot desync — under a
						// fling, a reversal, or the 0.8 scrub's lag, the frame is occluded on whatever frame this
						// fires. A set() inside a scrubbed timeline is a zero-duration tween, so it reverses.
						.set([heroMedia, heroScrim, heroLumen], { autoAlpha: 0 }, 0.56)
							// ...and with the photograph gone, the box stops being a thing you can touch.
							// Required by the pacing fix in index.astro: `.pos-sec` is now pulled UP into the
							// hero's transparent tail, so this box — which paints nothing after the exchange but
							// still contains a real, invisible `<a class="home-hero__cta">` at opacity 0 — comes
							// to overlap the positionering statement. An invisible link must not sit on top of
							// readable text and eat its clicks. Scoped to the whole hero rather than the content
							// alone because after 0.56 NOTHING in here is on screen: the box has been handed to
							// the sky, so it should intercept nothing. A set() inside a scrubbed timeline is a
							// zero-duration tween, so it reverses with everything else — scroll back up and the
							// hero is live again exactly as the photograph returns. Not autoAlpha/visibility:
							// that would pull the page's <h1> out of the accessibility tree on scroll.
							.set(hero, { pointerEvents: 'none' }, 0.56)
						// The title lifts away faster than the photograph (parallax depth) and is gone — read,
						// released — well before the night reaches it.
						.to(heroContent, { yPercent: -24, opacity: 0, ease: 'power1.in', duration: 0.46 }, 0);

						/* The pin-spacer must not intercept the beat that now sits underneath it.
						   ScrollTrigger wraps a pinned element in a `.pin-spacer` — a strut whose only job is to
						   reserve the pin's scroll distance. It is `position: relative`, and `.pos-sec` is a
						   static block, so the spacer hit-tests ABOVE the section no matter the DOM order. That
						   was harmless while `.pos-sec` began exactly at the spacer's bottom edge. Now that the
						   pacing fix pulls it 50svh UP into the spacer, it is not: MEASURED, the spacer ate every
						   click in the overlap — `elementFromPoint()` over "Maak kennis met Leo" returned
						   `DIV.pin-spacer` and the link could not be clicked at all. My regression, and one that
						   is completely invisible on screen — only hit-testing finds it.
						   The strut is not a thing on the page, so it should not catch anything. The hero inside
						   re-enables itself (`pointer-events` is not inherited past an explicit value), and the
						   timeline above still hands the hero itself to `none` at the exchange. Scoped to THIS
						   pin's own spacer, not `.pin-spacer` globally, so Scene 2's spacer is untouched.
						   ScrollTrigger owns this element's lifetime — a matchMedia revert removes the spacer
						   outright — so the inline style cannot leak. */
						const heroSpacer = hero.parentElement;
						if (heroSpacer && heroSpacer.classList.contains('pin-spacer')) {
							heroSpacer.style.pointerEvents = 'none';
							hero.style.pointerEvents = 'auto';
						}
				} else {
					// Mobile: no pin. A gentle push + fade as the hero scrolls away, so it still melts into the
					// sky rather than hard-cutting, without the weight of a pinned scene on a small device. The
					// hero-bounded dusk layer is desktop-only (with no pin there is no place to resolve its edge
					// before the box scrolls away), so mobile keeps the lighter D-41 melt.
					gsap.to(heroMedia, {
						scale: 1.12,
						ease: 'none',
						scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: scrubFor(0.8, coarse) },
					});
					// THE MELT MUST TAKE THE WHOLE SHOT WITH IT — the root cause of the owner's "dark bars
					// between sections" on mobile, and the reason the desktop hand-off never had one.
					// This branch used to fade `heroMedia` alone (to 0.15). But the photograph is modelled by
					// three stacked layers, and only one of them was leaving: `.home-hero__scrim` (a dark corner
					// gradient over the full box) held opacity 1 for the entire descent. MEASURED at 390x844,
					// at every scroll position from 0 to 800: media 1 -> 0.15, scrim 1, 1, 1. So the photograph
					// dissolved out from underneath its own scrim and what actually scrolled up the screen was
					// the scrim alone — an empty near-black rectangle with a hard bottom edge travelling over a
					// lit sky. Not a photograph leaving; a panel. Exactly what "accidental rectangular blocks
					// separating two visual surfaces" describes.
					// The fix is lockstep, not a new move: the scrim rides the SAME trigger and the SAME linear
					// curve as the photograph it models, so the two are never separable — what leaves the frame
					// is a shot fading, and the box hands off fully transparent (0, not 0.15) onto the stage
					// sky, which is the same transparent hand-off the pinned desktop scene reaches at unpin.
					// The choreography is unchanged: same start, same end, same ease, same melt.
					gsap.to([heroMedia, heroScrim].filter(Boolean), {
						opacity: 0,
						ease: 'none',
						scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: scrubFor(0.8, coarse) },
					});
					gsap.to(heroContent, {
						yPercent: -14,
						opacity: 0,
						ease: 'none',
						scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 65%', scrub: scrubFor(0.8, coarse) },
					});
				}
			}

			/* ---- SCENE 2 · THE WORK — arrive, then let the camera continue ----------------------------
			   The "geselecteerd werk" featured plate is the page's big-image moment. The camera ARRIVES at it
			   (the plate fills the viewport, pushes in and settles while the caption rises out of it), then the
			   shot HOLDS with an imperceptible continued push — never a frozen frame under scroll — and the pin
			   simply RELEASES, so native scroll carries the plate away and the camera keeps travelling.

			   Refinement over the first cut (owner runtime notes): the exit is no longer choreographed INSIDE
			   the pin (a scale-up + caption fade that read as "ScrollTrigger holding the page"). Two consequences
			   of that old exit are fixed at the root here: (1) the caption no longer fades to 0 and stays there —
			   it is present before, during AND after the moment, so the plate never leaves without its title
			   (content correctness, blueprint 7.151#24); (2) leaving is native scroll, so it feels as unforced as
			   arriving. There is also no dead "empty hold" tween — every unit of scroll through the pin moves the
			   image, so the reader never feels scroll has stopped. Desktop pins; mobile gets a lighter push-in. */
			const workImmersive = document.querySelector('.work-immersive');
			const plate = document.querySelector('.work-immersive__media');
			const plateCaption = document.querySelector('.work-immersive__caption-inner');
			if (workImmersive && plate) {
				gsap.set(plate, { transformOrigin: '50% 48%', force3D: true });
				if (desktop) {
					const tl = gsap.timeline({
						defaults: { ease: 'none' },
						scrollTrigger: {
							trigger: workImmersive,
							start: 'top top',
							end: '+=72%',
							scrub: scrubFor(0.8, coarse),
							pin: true,
							pinSpacing: true,
							fastScrollEnd: true,
						},
					});
					// ARRIVE — the camera pushes in and decelerates into the plate; the caption rises out of it
					// and STAYS (never fades — the shot always keeps its title).
					tl.fromTo(plate, { scale: 1.14 }, { scale: 1.0, ease: 'power2.out', duration: 0.55 }, 0)
						.fromTo(
							plateCaption,
							{ yPercent: 44, opacity: 0 },
							{ yPercent: 0, opacity: 1, ease: 'power2.out', duration: 0.5 },
							0.06
						)
						// HOLD with a breath — an imperceptible continued dolly so the frame is never frozen under
						// scroll (kills the "scrolling stopped" feel); at pin-end the plate is at rest and native
						// scroll takes over as the camera continues past. No pinned exit motion, no caption fade.
						.to(plate, { scale: 1.04, duration: 0.45 }, 0.55);
				} else {
					gsap.fromTo(
						plate,
						{ scale: 1.1 },
						{
							scale: 1.02,
							ease: 'none',
							scrollTrigger: { trigger: workImmersive, start: 'top bottom', end: 'top top', scrub: scrubFor(0.8, coarse) },
						}
					);
				}
			}

			const specParallax = (sel, amt, scale) => {
				const el = document.querySelector(sel);
				if (!el) return;
				gsap.set(el, { transformOrigin: '50% 50%', force3D: true });
				gsap
					.timeline({
						defaults: { ease: 'none' },
						scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: scrubFor(1.2, coarse) },
					})
					.fromTo(el, { yPercent: -amt * A, scale }, { yPercent: 0, scale: 1 })
					.to(el, { yPercent: amt * A, scale });
			};
			specParallax('.spec-card--arch .spec-card__media', 2.4, 1.05);
			specParallax('.spec-card--int .spec-card__media', 4.4, 1.09);

			const ctaBeats = document.querySelectorAll('.cta__lead > *, .cta__actions');
			if (ctaBeats.length) {
				gsap.from(ctaBeats, {
					yPercent: 14,
					opacity: 0,
					duration: 0.95,
					ease: 'power2.out',
					stagger: 0.08,
					scrollTrigger: { trigger: '.cta', start: 'top 80%', once: true },
				});
			}

			ScrollTrigger.refresh();

			// ENTRANCE — deliberately NOT wired here, and no longer gated on this module at all. It is pure
			// CSS on the hero's inner <img> and its two veil layers (see index.astro: `home-hero-enter` /
			// `home-hero-veil`), which buys three things this module cannot:
			//   1. it starts on the FIRST PAINTED FRAME, instead of whenever this deferred bundle lands — the
			//      old `html.motion-scene` gate meant a real connection would paint the hero lit, then snap it
			//      to black once GSAP arrived and lift from there;
			//   2. riding the inner <img> lets the entrance MULTIPLY with this module's camera on the parent
			//      instead of fighting it in the cascade (a running CSS animation beats an inline style, so the
			//      old version froze the hero against the scrolling reader for its full 2.2s, then popped);
			//   3. the first impression survives this bundle failing to load entirely.

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
