/*
 * aperture-light.js — the APERTURE runtime (P7.0 / D-46). Page-local, dependency-free, enhancement-only.
 *
 * SCOPE, AND WHAT THIS DELIBERATELY DOES NOT DO.
 *
 * The Diensten mechanism — "each aperture's light is a continuous function of that aperture's position
 * relative to the viewport" (DIENSTEN_MOTION_BLUEPRINT §12.1) — needs NO JavaScript. It is native CSS
 * scroll-driven animation (`animation-timeline: view()`, see `aperture.css`), which is reversible by
 * construction, costs 0 KB, and cannot desync. **This runtime does not drive the light, and no future
 * session should make it.** A JS re-implementation of the scroll mechanism would be a second source of
 * truth for the same thing, would need a `motion-scene`-style flag, would put the honest baseline behind
 * a bundle, and would buy nothing the platform is not already doing correctly.
 *
 * Nor is it a fallback. On an engine without scroll-driven animation the room simply keeps its frozen
 * D-29 static spills — a render §11 designates FIRST-CLASS ("Diensten degrades better than any page on
 * the site, and that is a consequence of the direction, not an accident"). Papering over that with JS
 * would trade an excellent baseline for a bundle.
 *
 * What it DOES: one job, no opinions. It writes damped, normalised pointer state onto any element
 * carrying `data-aperture-track`, and stops. It knows nothing about which photograph is a window, what
 * the light looks like, or how far it travels — all of that is CSS the author controls (§13: "The two
 * windows must not share one expression"). This is the engine; it is not the car.
 *
 *   --ap-px      -1..1   damped horizontal pointer offset from the element's centre
 *   --ap-py      -1..1   damped vertical pointer offset from the element's centre
 *   --ap-pointer  0..1   damped presence (1 = pointer over this window, 0 = gone)
 *
 * WHY DAMPED, NOT TRACKED. "The light EASES toward the pointer; it never tracks it exactly. Exact
 * tracking reads as a cursor gimmick; damping reads as light with mass" (CINEMATIC_MOTION_LANGUAGE §9.3).
 * Damping is frame-rate independent (see motion-math.js `damp`) so a 120Hz display and a 60Hz display
 * feel the same — the naive `+= delta * 0.1` idiom does not, and this project's standing lesson is that
 * headless can disagree with a real device.
 *
 * DISCIPLINE (all verified, not asserted):
 *   · Enhancement only. Attaches on a FINE POINTER with motion allowed. Touch, no-JS and reduced-motion
 *     never see it and lose nothing — no content, no affordance, no information is gated on it
 *     (§13: "Touch: no pointer families. Complete functionality, no hover dependency").
 *   · Writes custom properties ONLY. No layout is read in the loop; rects are cached and re-measured on
 *     enter / resize / scroll, so the loop never forces a reflow.
 *   · Self-halting. The rAF loop runs only while something is still moving and stops the frame it
 *     settles. A parked reader costs zero.
 *   · Live-reverting. A reduced-motion toggle or a pointer-capability change disarms it and RESTORES
 *     IDENTITY (the properties are removed, not zeroed), so the frozen composition returns exactly.
 *   · Emits no JS bundle: it is small and dependency-free, so Astro inlines it (verified in dist).
 */

import { clamp, damp, settled } from './motion-math.js';

/** Fraction of the remaining distance still left after one second. Lower = tighter. */
const SMOOTHING = 0.0001;
/** A backgrounded tab pauses rAF; clamp dt so the first frame back eases rather than teleports. */
const MAX_DT = 0.05;

/**
 * @param {object} [options]
 * @param {ParentNode} [options.root] subtree to scan (defaults to the document)
 * @returns {() => void} dispose — idempotent; removes every listener, observer and written property.
 */
export function initApertureLight({ root = document } = {}) {
	if (typeof window === 'undefined' || !window.matchMedia) return () => {};

	const els = Array.from(root.querySelectorAll('[data-aperture-track]'));
	if (!els.length) return () => {};

	const fineQ = window.matchMedia('(hover: hover) and (pointer: fine)');
	const motionQ = window.matchMedia('(prefers-reduced-motion: no-preference)');

	/** @type {Map<Element, any>} */
	let states = new Map();
	let io = null;
	let raf = 0;
	let last = 0;
	let armed = false;
	let disposed = false;

	const tick = () => {
		raf = 0;
		const now = performance.now();
		const dt = Math.min((now - last) / 1000, MAX_DT);
		last = now;

		let moving = false;
		states.forEach((s) => {
			if (!s.visible && s.cp === 0) return;

			s.cx = damp(s.cx, s.tx, SMOOTHING, dt);
			s.cy = damp(s.cy, s.ty, SMOOTHING, dt);
			s.cp = damp(s.cp, s.visible ? s.tp : 0, SMOOTHING, dt);

			// Snap once the remainder is invisible, so the loop can actually reach a stop.
			if (settled(s.cx, s.tx) && settled(s.cy, s.ty) && settled(s.cp, s.visible ? s.tp : 0)) {
				s.cx = s.tx;
				s.cy = s.ty;
				s.cp = s.visible ? s.tp : 0;
			} else {
				moving = true;
			}

			s.el.style.setProperty('--ap-px', s.cx.toFixed(4));
			s.el.style.setProperty('--ap-py', s.cy.toFixed(4));
			s.el.style.setProperty('--ap-pointer', s.cp.toFixed(4));
		});

		if (moving) raf = requestAnimationFrame(tick);
	};

	const wake = () => {
		if (raf || disposed) return;
		last = performance.now();
		raf = requestAnimationFrame(tick);
	};

	const measure = (s) => {
		const r = s.el.getBoundingClientRect();
		s.rect = r.width && r.height ? r : null;
	};

	const onMove = (e) => {
		const s = states.get(e.currentTarget);
		if (!s) return;
		if (!s.rect) measure(s);
		if (!s.rect) return;
		// Centre-relative, normalised to -1..1, clamped so a pointer at the very edge cannot overshoot.
		s.tx = clamp(((e.clientX - s.rect.left) / s.rect.width) * 2 - 1, -1, 1);
		s.ty = clamp(((e.clientY - s.rect.top) / s.rect.height) * 2 - 1, -1, 1);
		s.tp = 1;
		wake();
	};

	const onEnter = (e) => {
		const s = states.get(e.currentTarget);
		if (!s) return;
		measure(s);
		s.tp = 1;
		wake();
	};

	const onLeave = (e) => {
		const s = states.get(e.currentTarget);
		if (!s) return;
		// Ease the light back to centre as it goes, rather than leaving it stranded off-axis.
		s.tp = 0;
		s.tx = 0;
		s.ty = 0;
		wake();
	};

	// A rect is only valid until the page moves under it. Cheaper and safer than reading layout in the
	// loop: mark dirty here, re-measure on the next pointer event that needs it.
	const invalidate = () => states.forEach((s) => (s.rect = null));

	const clearProps = (s) => {
		s.el.style.removeProperty('--ap-px');
		s.el.style.removeProperty('--ap-py');
		s.el.style.removeProperty('--ap-pointer');
	};

	const arm = () => {
		if (armed || disposed) return;
		armed = true;

		els.forEach((el) => {
			const s = { el, rect: null, tx: 0, ty: 0, tp: 0, cx: 0, cy: 0, cp: 0, visible: true };
			states.set(el, s);
			el.addEventListener('pointerenter', onEnter, { passive: true });
			el.addEventListener('pointermove', onMove, { passive: true });
			el.addEventListener('pointerleave', onLeave, { passive: true });
		});

		// `pointerleave` is not guaranteed when a window scrolls out from under a stationary pointer, so a
		// catch-light could otherwise stay lit on a window nobody can see. This also keeps the loop from
		// writing to elements that are off screen.
		if ('IntersectionObserver' in window) {
			io = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						const s = states.get(entry.target);
						if (!s) return;
						s.visible = entry.isIntersecting;
						if (!s.visible) {
							s.rect = null;
							s.tp = 0;
						}
					});
					wake();
				},
				{ rootMargin: '10% 0px' }
			);
			els.forEach((el) => io.observe(el));
		}

		window.addEventListener('resize', invalidate, { passive: true });
		window.addEventListener('scroll', invalidate, { passive: true });
	};

	const disarm = () => {
		if (!armed) return;
		armed = false;

		if (raf) cancelAnimationFrame(raf);
		raf = 0;
		if (io) io.disconnect();
		io = null;

		window.removeEventListener('resize', invalidate);
		window.removeEventListener('scroll', invalidate);

		states.forEach((s) => {
			s.el.removeEventListener('pointerenter', onEnter);
			s.el.removeEventListener('pointermove', onMove);
			s.el.removeEventListener('pointerleave', onLeave);
			// Remove, don't zero: the element must return to exactly the composition CSS alone describes.
			clearProps(s);
		});
		states.clear();
	};

	const sync = () => {
		if (disposed) return;
		if (fineQ.matches && motionQ.matches) arm();
		else disarm();
	};

	// A reader can enable reduced motion, or plug in a mouse, without reloading.
	const onQueryChange = () => sync();
	fineQ.addEventListener('change', onQueryChange);
	motionQ.addEventListener('change', onQueryChange);

	const dispose = () => {
		if (disposed) return;
		disposed = true;
		disarm();
		fineQ.removeEventListener('change', onQueryChange);
		motionQ.removeEventListener('change', onQueryChange);
	};

	sync();
	// Backstop, mirroring home-cinema.js: nothing survives the page (no leaks, no zombie rAF).
	window.addEventListener('pagehide', dispose, { once: true });

	return dispose;
}
