/*
 * home-cinema.js — HOMEPAGE cinematic scene orchestration (P6.2 / D-39).
 *
 * Implements the two structural layers the native-only D-37/D-38 attempts were missing and that made the
 * homepage read as "losse secties / een document" (see documenten/HOMEPAGE_MOTION_CHOREOGRAPHY.md):
 *   1. a CONTINUOUS STAGE — one fixed world behind <main> whose light evolves across the whole descent, so
 *      atmosphere no longer hard-cuts at every section boundary;
 *   2. SCENE TRANSITIONS — each section is a "room" the camera arrives in; its light settles on entry, and
 *      the photography carries a weighted, reversible camera (parallax/depth) with a smoothing lag.
 *
 * Tooling: GSAP + ScrollTrigger (D-39 reopens D-37). NO Lenis — native scroll is retained; ScrollTrigger
 * `scrub` supplies the inertial "camera" weight without hijacking the scrollbar (blueprint 7.30).
 *
 * Progressive enhancement / restraint guarantees (blueprint 7.114-7.117 / 7.151#24 / MOT-07/08):
 *   - Runs ONLY under `prefers-reduced-motion: no-preference` (gsap.matchMedia condition). Under `reduce`
 *     nothing initialises, `html.motion-scene` is never set, the stage stays inert and the exact frozen
 *     D-38 per-section composition renders.
 *   - Without JS the module never loads: same frozen D-38 composition, content fully visible.
 *   - Everything is transform / opacity / custom-property only (compositor-cheap, CLS-safe). The LCP hero
 *     image is eager/priority and is never gated by this module.
 *   - Desktop gets the full system; mobile (<=52rem) gets gentler amplitudes, no pins, no pointer families.
 *   - All tweens/ScrollTriggers are created inside the matchMedia context, so a reduced-motion toggle or a
 *     breakpoint cross auto-reverts them (no leaks); a pagehide backstop kills anything remaining.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 * Per-scene light presets for the stage. Each is a target for the stage's custom properties:
 *   --st-cool   cool blue-hour glow opacity        --st-cool-y  its vertical anchor
 *   --st-warm   warm gold-family glow opacity       --st-warm-x/-y  its anchor (the "warm light source")
 *   --st-vig    depth-vignette / abyss intensity    --st-base    the continuous blue-hour base field opacity
 * The values model the descent: lit blue-hour hero -> calmer antechamber -> deepest gallery abyss with a
 * faint warm print-light -> cool/warm discipline split -> structural calm -> deep descent into the footer.
 */
const SCENES = {
	hero: { cool: 0.26, coolY: '-8%', warm: 0.0, warmX: '82%', warmY: '58%', vig: 0.04, base: 0.5 },
	pos: { cool: 0.14, coolY: '2%', warm: 0.03, warmX: '86%', warmY: '18%', vig: 0.14, base: 0.62 },
	work: { cool: 0.07, coolY: '20%', warm: 0.11, warmX: '58%', warmY: '54%', vig: 0.36, base: 0.72 },
	spec: { cool: 0.17, coolY: '8%', warm: 0.17, warmX: '90%', warmY: '78%', vig: 0.18, base: 0.6 },
	method: { cool: 0.1, coolY: '12%', warm: 0.04, warmX: '30%', warmY: '30%', vig: 0.15, base: 0.6 },
	cta: { cool: 0.08, coolY: '30%', warm: 0.05, warmX: '50%', warmY: '96%', vig: 0.32, base: 0.72 },
};

export function initHomeCinema() {
	if (typeof window === 'undefined' || !window.matchMedia) return;
	const docEl = document.documentElement;
	const stage = document.querySelector('.stage');
	if (!stage) return;

	const mm = gsap.matchMedia();

	mm.add(
		{
			motion: '(prefers-reduced-motion: no-preference)',
			desktop: '(min-width: 52.0625rem)',
		},
		(ctx) => {
			const { motion, desktop } = ctx.conditions;
			// Reduced motion: build nothing, and make sure the stage never takes over the D-38 atmospheres.
			if (!motion) {
				docEl.classList.remove('motion-scene');
				return;
			}

			gsap.registerPlugin(ScrollTrigger);

			// Amplitude scaling — gentler travel on mobile (blueprint 7.127-7.129), full on desktop.
			const A = desktop ? 1 : 0.55;
			const cleanups = []; // teardown for the manual event listeners added below

			/* --- Hand the atmospheric role to the continuous stage. Order matters: seed the stage to the hero
			   preset BEFORE flagging `.motion-scene`, so the per-section D-38 fills fade out onto an already
			   lit stage (no flash of flat ink). --- */
			gsap.set(stage, {
				'--st-cool': SCENES.hero.cool,
				'--st-cool-y': SCENES.hero.coolY,
				'--st-warm': SCENES.hero.warm,
				'--st-warm-x': SCENES.hero.warmX,
				'--st-warm-y': SCENES.hero.warmY,
				'--st-vig': SCENES.hero.vig,
				'--st-base': SCENES.hero.base,
			});
			docEl.classList.add('motion-scene');

			// A single reusable tween handle so scene changes overwrite each other cleanly (no stacking).
			const toScene = (preset) =>
				gsap.to(stage, {
					duration: 1.25,
					ease: 'power2.out',
					overwrite: 'auto',
					'--st-cool': preset.cool,
					'--st-cool-y': preset.coolY,
					'--st-warm': preset.warm,
					'--st-warm-x': preset.warmX,
					'--st-warm-y': preset.warmY,
					'--st-vig': preset.vig,
					'--st-base': preset.base,
				});

			/* --- SCENE LIGHT: as the camera arrives in each room, its light settles. Each section owns a
			   ScrollTrigger that (entering forward OR scrolling back up into it) tweens the stage to its
			   preset. This is what makes every boundary read as "entering a new room", not a colour step. --- */
			const scenes = [
				['.home-hero', SCENES.hero],
				['.pos-sec', SCENES.pos],
				['.work', SCENES.work],
				['.spec-sec', SCENES.spec],
				['.method-sec', SCENES.method],
				['.cta', SCENES.cta],
			];
			scenes.forEach(([sel, preset]) => {
				const el = document.querySelector(sel);
				if (!el) return;
				ScrollTrigger.create({
					trigger: el,
					start: 'top 62%',
					end: 'bottom 38%',
					onEnter: () => toScene(preset),
					onEnterBack: () => toScene(preset),
				});
			});

			/* --- HERO CAMERA: a very slow breathing zoom while at rest (the space breathes before you scroll)
			   plus a weighted parallax recede on scroll. Breathing animates `scale`; parallax animates `y` —
			   different transform channels, so they compose without fighting. The parallax travel stays within
			   the breathing overscan so no edge is ever exposed. The inner <img> keeps its D-38 pointer-tilt. --- */
			const heroMedia = document.querySelector('.home-hero__media');
			if (heroMedia) {
				gsap.set(heroMedia, { transformOrigin: '50% 45%', force3D: true });
				gsap.fromTo(
					heroMedia,
					{ scale: 1.055 },
					{ scale: 1.09, duration: 18, ease: 'sine.inOut', repeat: -1, yoyo: true }
				);
				gsap.fromTo(
					heroMedia,
					{ yPercent: 0 },
					{
						yPercent: -2.5 * A,
						ease: 'none',
						scrollTrigger: {
							trigger: '.home-hero',
							start: 'top top',
							end: 'bottom top',
							scrub: 1.1,
						},
					}
				);
			}

			/* --- FEATURED PLATE (gallery arrival): the print rises out of the depth and settles, then drifts
			   on. Authored as a scrubbed timeline whose MIDDLE keyframe is IDENTITY — the exact frozen D-38
			   composition when the plate is comfortably in view (preserves the D-38 pink-plate edge fix) —
			   deviating only on enter/leave, with overscan (scale) always exceeding the shift (yPercent). --- */
			const plate = document.querySelector('.work-immersive__media');
			if (plate) {
				gsap.set(plate, { transformOrigin: '50% 50%', force3D: true });
				const tl = gsap.timeline({
					defaults: { ease: 'none' },
					scrollTrigger: {
						trigger: '.work-immersive',
						start: 'top bottom',
						end: 'bottom top',
						scrub: 1.15,
					},
				});
				tl.fromTo(
					plate,
					{ yPercent: -3.2 * A, scale: 1.085 },
					{ yPercent: 0, scale: 1 }
				).to(plate, { yPercent: 3.2 * A, scale: 1.085 });
			}

			/* --- SPECIALISATIES (diptych depth): the two discipline photographs travel at DIFFERENT rates, so
			   they occupy different depth planes in one lit room. Center keyframe is identity so the D-38
			   composition (and the pointer-tilt rest state on the inner <img>) is untouched at rest. --- */
			const specParallax = (sel, amt, scale) => {
				const el = document.querySelector(sel);
				if (!el) return;
				gsap.set(el, { transformOrigin: '50% 50%', force3D: true });
				const tl = gsap.timeline({
					defaults: { ease: 'none' },
					scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
				});
				tl.fromTo(el, { yPercent: -amt * A, scale }, { yPercent: 0, scale: 1 }).to(el, {
					yPercent: amt * A,
					scale,
				});
			};
			specParallax('.spec-card--arch .spec-card__media', 2.2, 1.05);
			specParallax('.spec-card--int .spec-card__media', 4.2, 1.08);

			/* --- CONTACT CTA (the calm close, previously zero motion): a gentle light-rise on arrival. Guarded
			   so content is never trapped — GSAP only briefly plays 0->1 once the block scrolls in; without
			   JS / under reduce it never runs and the CTA renders in final state. --- */
			const ctaBeats = document.querySelectorAll('.cta__lead > *, .cta__actions');
			if (ctaBeats.length) {
				gsap.from(ctaBeats, {
					yPercent: 18,
					opacity: 0,
					duration: 0.9,
					ease: 'power2.out',
					stagger: 0.08,
					scrollTrigger: { trigger: '.cta', start: 'top 78%', once: true },
				});
			}

			/* --- HOVER FAMILY (Light/background): pointing at a work plate draws the stage's warmth toward it
			   (the podium "hover-poster" principle, translated to this world). Desktop fine-pointer only. --- */
			if (desktop && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
				const warmHosts = document.querySelectorAll('.work-immersive, .work-plate');
				warmHosts.forEach((host) => {
					const enter = () =>
						gsap.to(stage, {
							duration: 0.9,
							ease: 'power2.out',
							overwrite: 'auto',
							'--st-warm': 0.2,
							'--st-warm-x': '50%',
							'--st-warm-y': '52%',
						});
					const leave = () =>
						gsap.to(stage, {
							duration: 1.1,
							ease: 'power2.out',
							overwrite: 'auto',
							'--st-warm': SCENES.work.warm,
							'--st-warm-x': SCENES.work.warmX,
							'--st-warm-y': SCENES.work.warmY,
						});
					host.addEventListener('pointerenter', enter);
					host.addEventListener('pointerleave', leave);
					// NOTE: register teardown for later — do NOT use ctx.add(fn), which RUNS fn immediately
					// (it collects animations into the context), which would remove the listeners at once.
					cleanups.push(() => {
						host.removeEventListener('pointerenter', enter);
						host.removeEventListener('pointerleave', leave);
					});
				});
			}

			ScrollTrigger.refresh();

			// Context cleanup: drop the flag, remove manual listeners; GSAP reverts everything it created.
			return () => {
				docEl.classList.remove('motion-scene');
				cleanups.forEach((fn) => fn());
			};
		}
	);

	// Backstop: a full-page unload isn't SPA-routed here, but kill everything defensively (no leaks).
	window.addEventListener(
		'pagehide',
		() => {
			mm.revert();
		},
		{ once: true }
	);
}
