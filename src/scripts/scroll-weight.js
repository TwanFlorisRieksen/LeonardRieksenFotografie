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

/**
 * The most catch-up a scroll-linked move may carry under direct manipulation, in seconds.
 *
 * Not 0 (`scrub: true`): a hair of smoothing still absorbs a single dropped frame on a weak device, which
 * is worth having and is far below the ~100 ms at which a delay becomes perceptible as lag. Measured
 * against the numbers above, this takes the homepage hero's post-gesture travel from 800 ms to ~160 ms and
 * the specialisation plates' from 1766 ms to ~160 ms.
 */
export const TOUCH_SCRUB = 0.16;

/**
 * Weight for one scroll-linked timeline.
 *
 * @param {number} desktopScrub the authored value — the tuned weight for a pointer device
 * @param {boolean} coarse      true on a touch primary input; pass `ctx.conditions.coarse` so GSAP's
 *                              matchMedia rebuilds the context if the primary input ever changes
 * @returns {number} the scrub to use
 */
export const scrubFor = (desktopScrub, coarse) =>
	coarse ? Math.min(desktopScrub, TOUCH_SCRUB) : desktopScrub;

/**
 * The matchMedia condition every cinematic runtime adds alongside `motion` and `desktop`.
 * `(pointer: coarse)` describes the PRIMARY input, which is what "is a finger doing this?" actually asks —
 * `(any-pointer: coarse)` would also be true of a laptop with a touchscreen the visitor never uses, and
 * `hover` conflates input with a capability tablets partly report.
 */
export const COARSE_QUERY = '(pointer: coarse)';
