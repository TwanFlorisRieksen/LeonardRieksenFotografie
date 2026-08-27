/*
 * motion-math.js — the site's shared interpolation primitives (P7.0 / D-46).
 *
 * Dependency-free, side-effect-free, tree-shakeable. Small on purpose: this is the vocabulary every
 * runtime on the site needs and none of them should re-derive. Nothing here knows about the DOM, a page,
 * or a mechanism.
 *
 * NOTE ON `home-cinema.js`. It carries its own private copies of `clamp01`, `smooth`, `lerp` and `bump`.
 * They are deliberately NOT refactored to import from here: the homepage's cinematic is ACCEPTED, frozen
 * and uncommitted (D-41 → D-45), and this session's acceptance gate requires the homepage to build
 * byte-identical. Adopt these there the next time that file is legitimately open — not before, and never
 * as a drive-by.
 */

/** Clamp to the 0..1 unit range. */
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Clamp to an arbitrary range. */
export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

/** Linear interpolation. */
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Smoothstep — eases a 0..1 ramp so an arrival SETTLES rather than tracking linearly.
 * This is the curve the homepage's descending environment uses for every altitude blend; reuse it rather
 * than reaching for an easing token, because the token curves belong to the interface register and an
 * expo curve on a camera-length move produces a flash, not a move (CINEMATIC_MOTION_LANGUAGE §9.5).
 */
export const smoothstep = (t) => {
	t = clamp01(t);
	return t * t * (3 - 2 * t);
};

/**
 * A soft, symmetric hump centred at `c` with half-width `w`; 0 outside. Useful for "deepen AS the camera
 * passes X" without a trigger.
 */
export const bump = (p, c, w) => {
	const d = Math.abs(p - c) / w;
	return d >= 1 ? 0 : (1 - d * d) * (1 - d * d);
};

/**
 * Frame-rate-INDEPENDENT damping — the correct way to ease a value toward a target in a rAF loop.
 *
 * The naive idiom (`current += (target - current) * 0.1`) silently couples the feel of the motion to the
 * display's refresh rate: identical code settles roughly twice as fast on a 120Hz panel as on a 60Hz one.
 * This project's own standing lesson is that headless renders can disagree with a real device, and this
 * is one of the mechanisms by which that happens. `smoothing` is the fraction of the remaining distance
 * still left after one second — so the behaviour is defined in real time and reads the same everywhere.
 *
 * @param {number} current
 * @param {number} target
 * @param {number} smoothing fraction remaining after 1s (e.g. 0.0001 = snappy, 0.5 = heavy)
 * @param {number} dt elapsed seconds since the previous frame
 */
export const damp = (current, target, smoothing, dt) =>
	lerp(current, target, 1 - Math.pow(smoothing, dt));

/** True once `a` and `b` are close enough that further damping is invisible — lets a loop halt. */
export const settled = (a, b, epsilon = 0.0005) => Math.abs(a - b) < epsilon;
