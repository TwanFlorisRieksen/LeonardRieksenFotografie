/*
 * scroll-weight.js — ONE RULE FOR HOW MUCH WEIGHT A SCROLL-LINKED MOVE MAY CARRY (P14).
 *
 * THE OWNER'S REPORT. "Touch interaction, especially scrolling, feels as if the site was designed
 * primarily for a mouse." That is not a taste note, and it is not a frame-rate problem — the site holds a
 * solid 60 fps on a 390pt profile at 6x CPU throttling. It is a LATENCY problem, and it was measurable.
 *
 * THE MEASUREMENT (built site, 390x844, a 300 ms drag then release):
 *
 *     .home-hero__media opacity           at the instant the finger stopped: 0.98
 *                                         final value: 0.18, reached  800 ms LATER
 *     .spec-card--int .spec-card__media   still moving 1766 ms after the finger stopped
 *
 * So on the homepage the entire hero transition happened AFTER the gesture had ended. The reader's finger
 * did the work and the world answered about a second later, then kept sliding.
 *
 * THE CAUSE, and why it is one cause and not twenty. Every scroll-linked composition on this site is built
 * with a numeric ScrollTrigger `scrub` between 0.45 and 1.2 — that number is literally "seconds of catch-up".
 * On a WHEEL that is exactly right and must not change: a wheel notch is an impulse, the raw scroll position
 * arrives in steps, and the scrub is what converts a staircase into a camera move. Weight is the point.
 *
 * On a FINGER there is no staircase. Native touch scrolling is already continuous, already 1:1, and already
 * carries the platform's own momentum curve. Smoothing an input that is not jerky adds nothing to smooth —
 * it only adds lag, and lag under direct manipulation reads as the page resisting the hand. Hence:
 *
 *     SMOOTHING EXISTS TO SMOOTH A JERKY INPUT. TOUCH INPUT IS NOT JERKY.
 *
 * `scrubFor()` is that rule, stated once and applied at every scrub in the four cinematic runtimes, so the
 * composition, the choreography, the durations, the eases and the trigger ranges are all completely
 * unchanged — only how far BEHIND the reader they are allowed to run. Desktop keeps every tuned value.
 *
 * WHAT THIS DELIBERATELY IS NOT: a smooth-scroll library, a second animation system, a touch handler, or a
 * separate mobile build. Nothing here listens to an event, calls preventDefault, or touches scrollY. Native
 * scrolling remains the foundation on every device (blueprint 7.30).
 */

/* ============================================================================================
 * P22 / PERF-002 — THE SAME RULE, RE-SCALED: WEIGHT WITHOUT LAG
 * ============================================================================================
 * THE OWNER'S SECOND REPORT, on a pointer this time: the site "voelt stroperig", the image "blijft
 * bewegen nadat de invoer al is gestopt". The P14 note below diagnosed the touch half of this correctly
 * and fixed it; what it left standing is that the authored DESKTOP weights are also too heavy.
 *
 * WHY THE MEASURED NUMBERS LOOK BETTER THAN THE PAGE FEELS. ScrollTrigger's scrub is a tween with an
 * `expo` ease, which front-loads almost everything: at `scrub: 0.8` the homepage hero covers 90% of its
 * travel in 151 ms and then CREEPS through the last tenth for another 184 ms (measured t90 151 ms,
 * t99 335 ms). The average is respectable and the tail is what the eye actually reads — a picture that
 * is still arriving long after the hand stopped. That tail is what this compresses.
 *
 * WHAT IS NOT CHANGED, DELIBERATELY. Not one authored value is edited at its call site. Every scrub on
 * the site already passes through this function, so the art direction — which beat carries more weight
 * than which — stays exactly where its author put it, and is simply expressed over a shorter range. The
 * mapping below is monotone, so the ordering of all seven authored weights is preserved precisely:
 *
 *     authored   0.45   0.50   0.80   0.85   0.90   1.00   1.20
 *     pointer    0.100  0.107  0.147  0.153  0.160  0.173  0.200
 *     touch      0.060  0.064  0.088  0.092  0.096  0.104  0.120
 *
 * The ceilings come from the brief: ~0.10–0.18 s for general pointer movement, ~0.20–0.25 s at most for
 * the big hero transition (the heaviest authored weight, 1.2, lands on 0.20), and ~0.06–0.12 s on touch.
 * Nothing reaches 0, so a single dropped frame is still absorbed and no move becomes mechanical.
 * ============================================================================================ */

/** The lightest and heaviest authored weights on the site — the input range of the mapping. */
const AUTHORED_MIN = 0.45;
const AUTHORED_MAX = 1.2;

/** The output range under a pointer, in seconds of catch-up. */
const POINTER_MIN = 0.1;
const POINTER_MAX = 0.2;

/**
 * The output range under direct manipulation. Lower, for the reason the P14 note gives below: smoothing
 * exists to smooth a jerky input, and a finger is not jerky. Not 0 — a hair of smoothing still absorbs a
 * dropped frame on a weak device, and 0.06–0.12 s is far under the ~100 ms at which delay reads as lag.
 */
const TOUCH_MIN = 0.06;
const TOUCH_MAX = 0.12;

/** The old flat touch ceiling (P14), kept as a named value because the note below refers to it. */
export const TOUCH_SCRUB = 0.16;

const remap = (v, inMin, inMax, outMin, outMax) => {
	const t = inMax === inMin ? 0 : (v - inMin) / (inMax - inMin);
	const c = t < 0 ? 0 : t > 1 ? 1 : t;
	return outMin + (outMax - outMin) * c;
};

/**
 * Weight for one scroll-linked timeline.
 *
 * @param {number} desktopScrub the authored value — the tuned RELATIVE weight for this beat
 * @param {boolean} coarse      true on a touch primary input; pass `ctx.conditions.coarse` so GSAP's
 *                              matchMedia rebuilds the context if the primary input ever changes
 * @returns {number} the scrub to use
 */
export const scrubFor = (desktopScrub, coarse) =>
	coarse
		? remap(desktopScrub, AUTHORED_MIN, AUTHORED_MAX, TOUCH_MIN, TOUCH_MAX)
		: remap(desktopScrub, AUTHORED_MIN, AUTHORED_MAX, POINTER_MIN, POINTER_MAX);

/**
 * The matchMedia condition every cinematic runtime adds alongside `motion` and `desktop`.
 * `(pointer: coarse)` describes the PRIMARY input, which is what "is a finger doing this?" actually asks —
 * `(any-pointer: coarse)` would also be true of a laptop with a touchscreen the visitor never uses, and
 * `hover` conflates input with a capability tablets partly report.
 */
export const COARSE_QUERY = '(pointer: coarse)';
