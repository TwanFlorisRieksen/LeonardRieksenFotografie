/*
 * DE DOORTOCHT — the spatial traverse runtime.
 *
 * THE WORLD'S ONE RULE (unchanged since D-63, and it survives every geometry rewrite)
 * ----------------------------------------------------------------------------------
 * The world is made of photographs and nothing else. There is no floor, no wall, no room, no corridor,
 * no light source, no backdrop, no frame — no object of any kind that is not one of Leo's photographs.
 * The build test is literal: remove the works and the scene must be EMPTY, not a space with the pictures
 * taken down. Every previous portfolio architecture failed because it put the photography *inside*
 * something; this one has no inside.
 *
 * THE READING MOMENT
 * ------------------
 * Every work has exactly one moment on the journey — its ribbon parameter t = 0 — at which it is dead
 * centre, at the nearest point of the coil, and square on to the eye with ZERO foreshortening, because
 * that is the phase at which its own rotateY is 0°. Its CSS size is computed so that the perspective
 * magnification at that depth exactly fills the viewport's safe box, so "complete, unclipped, sharp" is
 * arithmetic rather than a clamp an unusual aspect ratio could defeat.
 *
 * A photograph is never cropped, never masked and never non-uniformly distorted. It foreshortens as it
 * turns away from the eye — that is perspective on a rigid plane, the same thing that happens to a real
 * print held at an angle — and it is exactly square on at the one moment it is meant to be evaluated.
 *
 * SCROLL IS NOT HIJACKED (blueprint 7.30 / Requirement 10)
 * --------------------------------------------------------
 * The page has a real, tall scroll container and a real scrollbar. We never call preventDefault, never
 * scrollTo on wheel, and never force step positions. scrollY maps linearly to the journey; the journey
 * follows it through a critically-damped spring, which adds weight WITHOUT taking control — releasing
 * input always settles at exactly where the user's own scroll position points. Keyboard paging, spacebar,
 * scrollbar dragging and native find-on-page all keep working.
 */

/*
 * ============================================================================================
 * THE COIL SEEN FROM OUTSIDE — geometry rebuilt from the reference recording (D-67)
 * ============================================================================================
 *
 * D-66 built a mathematically perfect helix and still did not reproduce the reference, because the
 * question it answered ("are these points on a helix?") was not the question that mattered. Four things
 * were wrong, and only the first one is about the helix at all:
 *
 *   axis         D-66 pointed the helix axis ALONG THE VIEW DIRECTION. The reference's axis is VERTICAL,
 *                perpendicular to the view. That single 90° difference is the whole "tunnel vs spring".
 *   camera       D-66 put the camera INSIDE the coil, travelling down its axis. The reference's camera is
 *                OUTSIDE, stationary, level, about NINE RADII away — a long lens on a large object.
 *   orientation  D-66 never rotated a work. Every work faced the screen. The reference's works are
 *                TANGENT TO THE CYLINDER: rotateY(θ), normal pointing radially outward.
 *   who moves    D-66 flew a camera through a fixed archive. In the reference the RIBBON IS STATIONARY
 *                ON SCREEN and the photographs flow ALONG it. That is where the calm comes from.
 *
 * MEASURED OFF THE RECORDING (21.4s, 1920×1080, one photograph tracked by colour across 4.6–7.8s):
 *
 *   axis is vertical      projected HEIGHT fell 252→232px (−8%) while projected WIDTH fell 328→88px
 *                         (−73%) over the same travel. Only rotation about a vertical axis does that;
 *                         recession would shrink both equally.
 *   camera is level       screen-y is LINEAR in θ (Δy/θ = −78,−80,−82,−82,−84,−86,−81,−84 px/rad over
 *                         0→73°). A camera above or below the centre would add a cos θ sag. There is none.
 *   D/R ≈ 9               from the −8% scale change between the near point and 73°:
 *                         (D−R)/(D−R·cos73°) = 232/252  ⇒  D = 9.25 R. Two independent fits gave 8.9.
 *   P/R ≈ 1.1            rise per radian 82px, so pitch = 2π·82 = 515px against a radius of ≈475px.
 *   card/R ≈ 0.84         a work is ≈401px wide intrinsic against R ≈ 475px ⇒ it subtends ≈50° of arc.
 *   turn ≈ 7              works abut rather than intersect, so Δθ ≈ the card's own arc ≈ 50°.
 *   pitch > card height   P = 515 against a card 277 tall: 1.65×. Works one full turn apart sit at the
 *                         SAME depth, so if the pitch were shorter than a card they would be coplanar and
 *                         overlapping — a depth tie with nothing to break it. The reference avoids this.
 *
 * WHERE THIS BUILD DEPARTS FROM THE RECORDING, AND WHY. Three numbers are deliberately not the measured
 * ones, and each departure pays for a constraint the reference does not have:
 *
 *   pitch 0.78 (ref 1.1)   The reference shows the BACK of its cylinder — the far half of its ribbon is
 *                          drawn mirrored. A mirrored photograph is a misrepresented one, so this build
 *                          hides backfaces (see traverse.css) and loses half the works the reference has
 *                          in frame. A tighter winding puts more STRANDS in the frame instead, which
 *                          restores the density without ever reversing a photograph.
 *   span 0.86 (ref 0.61)   The reference is a slider whose card reads at 29% of the frame width. The
 *                          blueprint requires the photograph to be the primary product, so the coil is
 *                          drawn larger. It stays under 1.0 because the black either side of the ribbon
 *                          is what gives the coil a silhouette — measured at 1.15, every strand ran edge
 *                          to edge and the spiral read as stacked bands.
 *   fit 0.38 (ref: n/a)    Every image in the reference is the same shape. This archive runs 1:1.5 to
 *                          5.5:1, and pure equal-area sizing let one panorama set the scale for
 *                          everything (measured: reading widths 17vw to 50vw, and strands that were a
 *                          single thin bar). See the note in measure().
 *
 * Everything below is expressed as a RATIO, because the ratios are what the recording actually fixes.
 * The absolute size of the coil is ours to choose, and it is the one place where this project departs
 * from the reference deliberately: the reference is a slider whose card reads at 29% of the frame width,
 * and the blueprint requires the photograph to be the primary product. `turn` is 6 rather than 7 and
 * `span` sizes the coil to the viewport, which buys a reading state at ≈48% of the frame instead — the
 * same spatial behaviour, a photograph you can actually evaluate.
 */
const CFG = {
	/* --- the coil, dimensionless (see the measurement table above) ------------------------------- */
	camDist: 9.0, // D/R — camera distance from the axis, in radii. THE number that says "outside".
	pitch: 1.44, // P/R — rise per full revolution, in radii. THE STRETCH. The reference is a long, slow
	// spring, not a compact coil; the owner's correction was "langere windingen, niet méér windingen in
	// beeld". A tall pitch spaces the strands far apart vertically so the eye reads one elegant descending
	// helix instead of three squashed rings. D-67 kept this short (0.78) to buy back the strands it lost by
	// HIDING backfaces; now that the whole coil is drawn (both faces), the density is there and the winding
	// can open up past the reference's own 1.1. MEASURED (P8.2r/D-69, 1440×900): 1.12 read as ~1.8 turns and
	// the owner still called it "te compact"; 1.45 opened it to ~1.2 turns but dissolved the coil into
	// "scattered cards" (the D-67 failure again). 1.34 sits at ~1.55 turns — the longest winding that still
	// reads AS a winding, with clear sky between strands and no card marooned in a black field. D-72 opened it
	// a touch further, 1.34→1.44 ("iets langere windingen, niet dramatisch; rustiger, luxer"), and lowered
	// pitchClear in step so the extra rise becomes AIR between the strands rather than a bigger card — the
	// windings lengthen and the coil gains "meer lucht" without the photograph growing. Angular tiling is
	// independent of pitch, so a longer winding can never open a hole in the ribbon; it only spaces the strands.
	fill: 1.0, // fraction of its angular slot a photograph occupies. 1 = chords abut exactly.
	pitchClear: 0.51, // tallest work as a fraction of the pitch (0.55→0.51, D-72) — this is what sets the size
	// of every photograph, because it is the binding constraint. It is deliberately well below the pitch now: a big
	// pitch with a big pitchClear just grows the cards to fill the new space (same few giants, more spread).
	// Keeping the card a little over half the pitch leaves clear sky between the strands, which is what makes
	// the coil read AS a coil — a ribbon winding through space — rather than as stacked photographs.

	/* --- how large the coil is drawn ------------------------------------------------------------- */
	/* THE COIL IS NARROWER THAN THE FRAME, and that is a measured property of the reference, not slack.
	   Its ribbon spans 2R = 950px inside a 1560px frame — 61% — so a strand begins and ends inside the
	   picture, with black to the left and right of it. Push `span` past 1 and every strand runs edge to
	   edge instead, the coil loses its silhouette, and what is left is bands of photographs rather than a
	   spiral seen from outside. Measured at 1.15: one full-width strand, 35% of the frame covered by a
	   single row, and no second strand in view at all. */
	span: 0.66, // R as a fraction of the safe box's HALF-WIDTH (reference 0.61). D-67 pushed this to 0.86
	// to make the photographs large, but that overflowed the coil off both sides and left only a broken
	// front arc of two or three giants in frame — the owner saw "scattered cards", not a spiral. Back near
	// the reference, the whole revolution fits inside the frame with black to either side, so the coil has a
	// silhouette and the winding is legible. The reading moment is still a real photograph (measured below).

	/* --- reading ---------------------------------------------------------------------------------- */
	/* The reading moment is t = 0: θ = 0, y = 0, z = +R. The work is square-on (rotateY(0) — no
	   foreshortening at all), centred, and at the NEAREST point of the entire coil, so nothing can be in
	   front of it. D-66 needed a paint-order override and a per-work cull distance to protect the reading
	   state; here the geometry protects it, and both hacks are gone. */
	fit: 0.38, // 0.5 = equal area, 0 = equal width, 1 = equal height. See the note in measure().
	/* An overall ceiling, so an archive of small works on a tall screen cannot grow until the coil is
	   nothing but two photographs. `pitchClear` binds first on every viewport measured so far. */
	readArea: 0.62,
	readCap: 0.95, // hard ceiling on either axis, so an extreme ratio can never reach an edge

	/* --- depth atmosphere -------------------------------------------------------------------------- */
	/* The far side of the coil is DRAWN now (backface-visibility: visible), so this grade is what keeps it
	   reading as "the back, in shadow" rather than as a second gallery competing with the near face. The
	   back is pushed dark and the falloff is shaped (depthGamma) so the front third of the coil holds full
	   brightness and the plunge into shadow happens across the far half — the reference's own near/far
	   contrast. Freeze both to see the geometry raw; neither is where the spatial illusion comes from. */
	farDim: 0.20, // opacity at the very back of the coil; 1 at the front. P15: lowered 0.34 -> 0.20. The
	// depth-of-field that used to keep the far half of the ribbon from reading as a second, mirrored gallery
	// is gone (see `backDim` below and PERFORMANCE, P15), so the separation between the near face and the
	// back has to be carried entirely by LIGHT — which is what the owner asked for in the first place
	// ("de foto's die niet gecentreerd zijn moeten donkerder lijken, terugvallen"). At 0.20 over the site's
	// near-black ground the back of the coil reads as shadow with structure in it, not as a black void and
	// not as a picture.
	depthGamma: 1.9, // >1 keeps the near face bright longer and darkens the turn into the back faster. Nudged
	// 1.8 -> 1.9 with `farDim`, so the FRONT strand keeps essentially all of its light and the plunge into
	// shadow is concentrated on the genuine back — the front of the coil must not get darker than it was.
	/* ============================================================================================
	 * P15: THERE IS NO BLUR IN THIS WORLD ANY MORE.
	 *
	 * WHAT WENT. `farBlur` (7px of defocus on the back hemisphere, shaped by `backGamma`) and with it the
	 * whole `filter: blur()` write path — the `grade` element, `lastFilter`, `blurPx`, `angleBlur` and
	 * `edgeBlurMax`. `neighborBlur` and `edgeBlurMax` were already 0 (D-72 rev.2); `farBlur` was the last
	 * one left, and it was the expensive one.
	 *
	 * WHY. A CSS `filter` forces Chrome to allocate a render surface for the element it is on. D-81 proved
	 * that the cost is the SURFACE and not the effect (a STATIC blur measured the same as a dynamic one) and
	 * moved the blur one level in, onto `.media`, which bought the median frame back. But a render surface
	 * inside a 3D-transformed subtree still has to be rasterised at device resolution, and on a Retina phone
	 * there are a dozen of them at once. The owner's instruction is unambiguous and it is the right call:
	 * no CSS blur anywhere in the active portfolio rendering.
	 *
	 * WHAT REPLACES IT — and it is a REPLACEMENT, not a deletion. The back of the coil had two jobs to do
	 * and the blur was doing both:
	 *   1. keep the far half from competing with the near face. Now carried by `farDim` + `depthGamma`
	 *      (opacity) and by `backDim` (brightness), both of which are compositor/colour-matrix work with no
	 *      render surface at all.
	 *   2. keep a BACKFACE — a photograph turned past 90°, which presents its image mirrored — from ever
	 *      reading as a backwards photograph (the D-68 constraint). That is what `backDim` is for: a work
	 *      past the side of the coil loses most of its light, so what the eye gets is the shadowed verso of
	 *      a card that has turned away. Measured on the render at 1440x900: a fully-turned work sits at
	 *      opacity 0.20 and brightness 0.42, i.e. ~8% of the luminance of the reading work. It is present
	 *      as depth and it is unreadable as a picture, which is exactly the trade the blur was making.
	 * ============================================================================================ */
	backDim: 0.58, // brightness a fully-turned-away (180°) work loses. 0 across the whole FRONT hemisphere,
	// ramping in only once a work has passed the side of the coil, shaped by `backGamma` — so a front-facing
	// OR side work keeps its light and only the genuine back falls into shadow.
	backGamma: 1.6, // >1 keeps the near-back gentle and deepens the shadow toward the very back. `back =
	// max(0, -z/R)^backGamma` — 0 across the entire front hemisphere (z >= 0). Eased 1.9 -> 1.6 because this
	// now shapes a luminance ramp rather than a blur radius: light needs to start falling a little earlier
	// than defocus did, or the turn into the back reads as a switch rather than as a rotation into shadow.

	/* --- feel --------------------------------------------------------------------------------------- */
	scrollPerWork: 720, // document pixels of scroll per work. Raised from 640 (D-70) so each work lingers
	// longer at its reading moment — the owner asked for "meer rust, meer luxe", and a slower cadence per
	// work is the temporal half of that (the pitch is the spatial half). Geometry is untouched; this only
	// scales scroll↔journey, so the reading moment still lands exactly on an integer journey.
	damp: 0.4, // spring coefficient toward the scroll-derived target, expressed PER 60Hz FRAME and normalised
	// to real time in tick() (see there). The reading moment must SETTLE square-on rather than snap, so this is
	// a spring and not a follow — but it is a fast one.
	//
	// P15: 0.15 -> 0.26, and the number is arithmetic rather than taste. A per-frame coefficient k has time
	// constant -16.7ms / ln(1 - k), so:
	//     0.082 (pre-D-81)  203 ms   ~470 ms to 90% of a new target
	//     0.15  (D-81)      103 ms   ~237 ms          MEASURED on the built page: 280 ms, wheel to settle
	//     0.26  (P15)        55 ms   ~127 ms
	// D-81 fixed the GAIN (the world travels exactly as far as the scrollbar) and cut the lag by half, and
	// the owner still reports "het reageert met vertraging / alsof het achter je aan komt". 237 ms is a
	// quarter of a second between a wheel notch and the world arriving, which is well above the ~100–150 ms
	// at which a delay stops being weight and becomes lag. 127 ms sits under it: the coil still glides into
	// its reading angle and still carries visible mass, but it starts and finishes WITH the gesture.
	// The touch profile (TOUCH_CFG) is unchanged at 0.42 — under a finger there is no staircase to smooth.
	// The adaptive term in tick() (larger jumps damp harder, so a teleport arrives) is unchanged.
	//
	// PERF-002 (P22): 0.26 -> 0.40, and again the number is arithmetic. The brief asks for roughly 60–90 ms
	// of effective settling on the portfolio's primary motion, and the same time-constant identity gives:
	//     0.26            55 ms constant   ~127 ms to 90% of a new target
	//     0.40            33 ms constant    ~75 ms                          <- inside the asked-for band
	// The pointer profile now sits essentially where the touch profile already was (0.42, ~71 ms), which is
	// the point: 71 ms was measured to feel like the coil starting and stopping WITH the hand, and there is
	// no reason a wheel should be answered a great deal later than a finger. The coil still settles
	// square-on rather than snapping — it is still a spring, and the reading moment still ARRIVES — but the
	// weight is now carried by the geometry and the ease, not by lag.
	margin: 0.055, // safe-box inset as a fraction of the smaller viewport axis
	/* PERF-010 (P22): 1.15 -> 1.0. The brief asks for a smaller active set, with the hard condition that no
	   gap may open in the spiral and no visible photograph may disappear. That condition is already met by
	   construction here and the measurement proves it: `edgeStart` fades a work out over the outer band, so
	   by the time it reaches the cull line its opacity is essentially zero. MEASURED at five journey
	   positions, the FAINTEST work still on screen sits at opacity 0.001–0.066 — nothing that is culled can
	   be seen. Moving the line in to exactly one half-viewport-height plus half the tallest card removes two
	   to four of those invisible panels per frame (live works 11/13/21/20/11 -> 10/12/19/18/10) and changes
	   the rendered page by a mean of 0.32/255, confined to the very faintest card edges.
	   It is not taken further: at 0.9 the count falls to 9/12/17/17/9 but a LEAD-IN starts being culled at
	   the crown, which is the one place a gap in the coil would be visible. The remaining ~18 live panels
	   are the composition — a full winding of the spiral — and removing more would mean removing
	   photographs the visitor can see, which the brief rules out. */
	edge: 1.0, // cull once a work is this many half-viewport-heights from centre

	/* --- life ---------------------------------------------------------------------------------------- */
	/* ============================================================================================
	 * THE CAMERA SWAY IS GONE, AND THE WORLD STILL LIVES AT REST (PERF-007, P22).
	 *
	 * WHAT WAS HERE. `idleDelay`, `idleRamp`, `swayAmp`, `swayPeriodX/Y` and `renderAmbient()`: once the
	 * visitor had been still for ~520 ms, a slow Lissajous eased in on the viewport's `perspective-origin`,
	 * so the coil floated. D-72 added it against "de wereld leeft niet", and as a piece of direction that
	 * was the right call.
	 *
	 * WHY IT COSTS WHAT IT COSTS. `perspective-origin` lives on the element that establishes the coil's 3D
	 * context, so writing it invalidates the computed style of every panel underneath it — D-84/D-85 found
	 * exactly this class of defect on this page and D-84 already gated the write to changed values only.
	 * But the value CHANGES on essentially every frame while the sway is running, so the gate never fires
	 * while it matters. Worse, it is the one term in this runtime that is a function of TIME rather than of
	 * scroll, which means the frame loop can never be allowed to stop: a world that is always moving always
	 * has work to do, at 60 fps, forever, on a page nobody is touching.
	 *
	 * WHAT REPLACES IT — and it is a replacement, not a deletion. The world behind the coil already
	 * breathes, in CSS, on the compositor: `.tv-sky__breath` runs a 16 s opacity+scale cycle and
	 * `.tv-sky__haze` a 26 s drift (portfolio-chrome.css §2). Those are the layers the eye actually reads
	 * as "the air is alive", they cost no main-thread style work at all, and they keep running whether or
	 * not this loop is awake. The coil itself now stands exactly where the visitor put it, which is also
	 * what the reading moment asks for: a photograph presented for evaluation should not be drifting.
	 *
	 * TO RESTORE: re-add the five tunables above, `renderAmbient()`, the `life`/`clock`/`lastOrigin` state
	 * and its call in tick(), and make `busy` in tick() unconditionally true. See the changelog, PERF-007.
	 * ============================================================================================ */

	/* --- THE PAGE TRAVELS BY ITSELF (P21 / D-93, owner: "zorg voor een automatische, slome scroll in de
	   portfolio … als je iets hebt aangeraakt, zelf heb gescrolt, of een foto lightbox heb geopend en weer
	   sluit, en je houdt de pagina zelf niet meer vast, moet er een automatische scroll komen, subtiel, traag,
	   maar moet er altijd zijn") ---------------------------------------------------------------------------

	   WHAT THIS REPLACES. D-72 shipped an idle "drift": `autoOffset`, a bounded addend to the spring target
	   that turned the coil a little while the visitor was still, WITHOUT ever moving window.scrollY. P15 then
	   made its ceiling permanent (autoMax 0.5 works), so the world settled onward for about twelve seconds
	   after the first pause and then held for good. That mechanism answers a different brief than this one:
	   it is a BREATH, and the owner has now asked for a JOURNEY — one that resumes after every interaction and
	   "moet er altijd zijn". A bounded camera offset cannot be that, for a reason that is arithmetic rather
	   than aesthetic: unbound it and the world runs to the end of the coil while the scrollbar still says the
	   top, after which the drift dead-ends, the scrollbar is grossly dishonest, and a scroll down moves
	   nothing because the journey is already clamped at `span`. So `autoOffset` is gone, and the auto travel
	   is a REAL SCROLL of the page.

	   WHAT IT IS. While the visitor is not driving, the engine advances `window.scrollY` by a fraction of a
	   pixel per frame. Everything downstream — the journey, the spring, the chrome's progress hairline, the
	   world beats, the scrollbar thumb, the ending — is fed by the existing scroll path and needs no special
	   case: the page is simply being scrolled, slowly, and the world follows exactly as it follows a finger.
	   The scrollbar therefore never lies, which is the one thing the D-72/P15 lineage could never deliver.

	   WHY THIS IS NOT THE PROGRAMMATIC SCROLL P15 DELETED. That one was a JUMP — 142 px landing 480 ms after
	   a gesture the visitor had already finished, so the thumb visibly leapt while the screen did not move.
	   This is a continuous sub-pixel creep that only ever runs when the visitor has been still for
	   `autoDelay`, and it yields INSTANTLY and completely on any input (see `releaseAuto`) — wheel, touch,
	   pointer, key, or a scroll event that is not the one we just wrote. The scroll input of the visitor
	   stays leading (blueprint 7.30): they can stop it, reverse it and leave at any moment, and doing so
	   costs one gesture, not a fight.

	   WHERE IT STOPS. At the end of the WORKS range, where the ending zone begins — the coil's dissolve into
	   the contact invitation is a departure, and a page should not walk the visitor out of the door by
	   itself. It resumes the moment they scroll back up.

	   ACCESSIBILITY. Reduced motion never mounts the runtime, so there is no auto-scroll there at all. Under
	   the pointer profile the visitor also gets an explicit, persistent pause in the world mark
	   (`[data-pf-auto]`, wired in start()) — auto-advancing content that runs for more than five seconds
	   needs a mechanism to stop it (WCAG 2.2.2), and "scroll to interrupt it for 1.4 s" is not one. Keyboard
	   focus inside the coil also holds it, because travelling the camera under a focused work would fight the
	   person using it. */
	autoSpeed: 0.09, // works per second the page scrolls itself at full speed. 0.09 x scrollPerWork (720) is
	// ~65 px/s, i.e. a new photograph arriving square-on roughly every 11 seconds — a gallery pace. The D-72
	// drift ran at 0.04 and its tuning note is still true of a DRIFT (at 0.08 a three-second pause turned the
	// work being read 12 degrees off square-on, which is the world leaving while you look at it). That note
	// was about a world that is supposed to stay where it was put; this is a world that is supposed to
	// travel, and 0.04 (29 px/s, 25 s per work) reads as a fault rather than as a journey.
	autoDelay: 1400, // ms of no visitor input before the page starts moving itself. Comfortably clear of the
	// 900 ms `tv-emerge` entrance, and long enough that the end of a wheel gesture is not immediately
	// followed by the page carrying on without being asked.
	autoRamp: 1600, // ms for the auto-scroll to ease from nothing to full speed, so it never starts with a
	// step. Release is NOT ramped — input drops it to zero on the same frame.

	/* --- the reading moment gets a moment (D-70, owner: "de gecentreerde foto verdient subtiele nadruk") -
	   The work square-on at t=0 is already the sharpest, nearest and largest thing on screen, but at rest it
	   sits at the same brightness as its neighbours. This lifts ITS OWN light — a small brightness, contrast
	   and saturation gain that eases in only across the last few degrees before square-on — so the eye is
	   drawn without a glow, a plate or a drop shadow, none of which this world is allowed to own. The lift is
	   deliberately gentle: Leo's architecture frames are already bright, and a heavy hand blows the highlights
	   on exactly the frame the whole traverse exists to present. A whisper of scale (readScale) rides with it,
	   staying inside the 5% headroom the readCap leaves so the photograph never clips. */
	readFalloff: 0.3, // radians of |θ| over which the emphasis eases from full (0) to none. ~17°. Widened
	// 0.24→0.30 (D-72) so the hero's light eases in over a slightly larger arc — a calmer, more premium arrival
	// of the light rather than a late switch-on.
	readBright: 0.12, // peak brightness gain at square-on. Raised 0.08→0.12 (D-72): with the front neighbours
	// now kept sharp, the hero is distinguished by LIGHT, so its own light lifts a little more. Still gentle —
	// Leo's architecture frames are already bright and a heavy hand blows the highlights on the very frame the
	// traverse exists to present.
	readContrast: 0.08, // peak contrast gain (0.06→0.08, D-72)
	readSat: 0.12, // peak saturation gain (0.09→0.12, D-72) — the archive is vivid; the hero reads richest
	readScale: 0.03, // peak extra scale at square-on (3%, 0.02→0.03 D-72); stays within readCap's 5% headroom

	/* --- the gold mount line (P8.5 / D-76). Deliberately a MUCH narrower window than readFalloff: the light
	   lift is an approach (it should already be growing while a work is still turning toward you), but the
	   gold hairline is a STATEMENT — "this one, now" — and a statement that is true for 17° either side is
	   not a statement. 0.14 rad ≈ 8°, which at this coil's cadence means gold is absent for most of the
	   travel between two works, blooms as the spring settles, and releases as it leaves. Smoothstepped in
	   `place()`, so both ends of the fade are gentle; there is no CSS transition anywhere near it. */
	goldFalloff: 0.22, // P8.6 (D-77): 0.14 → 0.22 rad (8° → 12.6°) — see place() for why the ends matter more.

	/* --- project covers: a whisper more presence (Phase 4, D-74) — see mkNode's isSeries. A SERIES cover
	   hangs a touch nearer and catches a little more light at its reading moment than a loose work, so the
	   "here a project begins" is felt spatially and not only read in the caption. Applied ONLY to series
	   covers, riding on the same `read` envelope, so it eases in and out with the reading moment and is 0 for
	   every loose work. Light-based first (no clipping risk), with a whisper of scale that stays inside the
	   readCap headroom (readScale 0.03 + 0.014 = 0.044 < the 5% the readCap 0.95 leaves). */
	seriesReadBright: 0.07,
	seriesReadSat: 0.06,
	seriesReadScale: 0.014,

	/* --- neighbour hierarchy: LIGHT (D-72; the ONLY hierarchy in the world since P15) --------------------
	   D-71 kept exactly ONE card crisp and blurred every front neighbour up to 7px, so the whole front strand
	   read as a soft smear around one sharp hero — the owner judged this "doorgeschoten": the photography was
	   suffering under the effect (blueprint priority 1). The hierarchy is carried by LIGHT: a front work
	   loses a little brightness as it turns away from square-on (`neighborDim`), so the hero is the brightest
	   plane on the coil while its neighbours stay sharp and fully readable. The term is multiplied by `depth`
	   so it only touches the FRONT strand — the back is handled by `backDim` + the opacity grade, and
	   double-treating it would flatten the coil. The reading card (theta=0) is always exactly full
	   brightness, so its guarantee is untouched. */
	sharpFalloff: 0.72, // radians of |θ| over which a front neighbour turns from square-on (0) to full (~41°)
	/* P15: `neighborBlur` is gone with the rest of the blur (see the note above `backDim`). It had been 0
	   since D-72 rev.2 — the entire front hemisphere is the focal plane and always was. */
	neighborDim: 0.22, // brightness a fully-turned FRONT neighbour loses (0.16→0.22, D-72 rev.2). With the
	// front strand now perfectly sharp, LIGHT is the only thing separating the hero from its crisp neighbours,
	// so the falloff is a touch deeper — the eye still lands on the brightest, square-on plane, and the side
	// works read as receding into shadow rather than being smeared.

	/* --- entrance & exit (D-70, owner: "foto's verschijnen niet, ze arriveren en vertrekken") -----------
	   A work does not pop in at the cull line and vanish at it. It rises from the soft bottom of the frame,
	   sharpens and brightens as it nears the reading band in the vertical centre, holds its moment, then
	   softens and fades as it rides up and away. Implemented as a vertical focus band: fade and defocus grow
	   with |y|, the same axis the work travels along, so arrival and departure are one continuous gesture and
	   the centre of the frame is always the clearest place — which is the reference's cinematic look as well
	   as an honest "this is the thing to look at now". edgeStart keeps the middle of the frame untouched so
	   the coil stays legible; only the outer band breathes. */
	edgeStart: 0.46, // fraction of the way to the cull (|y|/liveY) at which softening begins. Lowered slightly
	// 0.5→0.46 (D-72) so a work spends more of its rise/fall arriving and departing — the gesture starts earlier
	// and is gentler, which is the "foto's arriveren en vertrekken, ze verschijnen niet" the owner asked for.
	/* P15: `edgeBlurMax` is gone with the rest of the blur. It had been 0 since D-72 rev.2 — a departing
	   work fades (opacity) and recedes (edgeSink); it was never defocused. */
	edgeSink: 220, // px of translateZ recession a work reaches as it leaves the frame (D-72). A work near the
	// cull sinks away from the camera and fades, so it ARRIVES from depth as it rises to centre and DEPARTS
	// into depth as it rides off — an honest, un-blurred entrance and exit that reads as travel, not a pop.

	/* --- image delivery (P9 / D-80) ---------------------------------------------------------------------
	   How far beyond the cull line (|y| / liveY) a photograph is fetched. 2.6 is roughly two further windings
	   of the coil in each direction: at the measured travel speed a work is requested several seconds before
	   it can be seen, which is what keeps the traverse feeling loaded rather than loading, while still cutting
	   the initial request set from the whole archive to the works that are actually near. */
	loadAhead: 2.6,
	/* …but NOT on the very first pass. MEASURED on the built site at 1.6 Mbps / 4× CPU: the mount's first
	   render restored 29 of the 56 works at once, so the six photographs the visitor is actually about to
	   see arrived at 1281/1682/1882/2282 ms while sharing the connection with twenty-three that cannot be
	   seen yet — and the entrance curtain, which waits on the crown, held for all of it. The crown's own
	   bytes were only ~103 KB; they took 1.5 s because of what they were queued alongside. So the window
	   opens narrow — just past the cull line, enough that nothing can pop in unloaded — and widens to the
	   full look-ahead once the arrival is over. Purely a delivery schedule: every photograph the coil can
	   reach is still fetched well before it can be seen. */
	/* PERF-008 (P22): 1.4 -> 1.05. MEASURED on the built site before this change: the first frame released
	   28 of the 56 works at once and the page made 32 image requests before the visitor had touched
	   anything, while the engine was drawing 11 works and 7 lead-ins. 1.0 is exactly the cull line — the
	   set that is genuinely on screen — so 1.05 is that set plus a hair, which is what "no visible card is
	   ever empty" actually requires. Everything else still arrives well before it can be seen, through the
	   look-ahead that opens at `loadRampMs`. */
	loadAheadFirst: 1.05,
	loadRampMs: 1600, // ms after mount at which the look-ahead opens to `loadAhead`
	/* HOW MANY PHOTOGRAPHS MAY START LOADING IN ONE FRAME (PERF-008). Releasing a whole window at once
	   hands the browser twenty-odd requests against six connections and twenty-odd decodes against one main
	   thread, which is the "tientallen gelijktijdige downloads en decodes" the brief rules out. Spreading
	   them costs nothing in wall-clock time — at six per frame a fast scroll still releases 360 per second,
	   far more than the coil can travel past — but it keeps any single frame cheap. The loop is kept awake
	   while a release is still pending (see `pendingRelease`), so a capped frame can never strand a panel
	   that is about to be seen. */
	loadPerFrame: 6,

	/* --- premium hover (D-70, owner: "een hoogwaardige hover — geen standaard zoom of simpele schaduw") --
	   On a real pointer, resting on a work lifts it a little OUT of the coil toward the eye — a translateZ, so
	   perspective grows it a hair and it gains presence the way stepping toward a print does, not a CSS scale
	   bolted on top. A small brightness rides with it and it takes paint priority. No shadow, no outline, no
	   zoom. Eased over ~200ms so it feels weighted. Enabled only where (hover:hover) and (pointer:fine). */
	hoverLift: 46, // px of translateZ toward the camera at full hover
	hoverBright: 0.1, // brightness gain at full hover
	hoverEase: 0.18, // per-frame approach toward the hover target (≈200ms settle)

	/* --- a worthy ending (D-70, owner: "ontwerp een echt einde; de footer hoort NA de reis") -------------
	   After the last work has held its reading moment, an outro zone of one viewport lets the whole coil
	   recede and dissolve — decreasing intensity, an elegant hand-off — before the site footer flows up
	   underneath it. The fixed camera surface is hidden once the coil is gone so the footer is fully the
	   visitor's. See readScroll()/renderOutro(). */
	outroVh: 1.0, // outro length as a multiple of the viewport height, appended after the works
	leadCount: 7, // decorative works ABOVE the crown that complete the coil at the start — see the template

	/* --- narrow viewports ---------------------------------------------------------------------------- */
	/* A phone cannot afford a coil that fits inside it: at 390px, R = half the safe box makes the reading
	   state 180px wide, which is the failure D-65 and D-66 were both corrected for. The answer is to stand
	   CLOSER to the same spring rather than to shrink it — R grows past the viewport, the coil runs off
	   both edges, and the photograph gets the width. Less of the revolution is visible; the photograph is
	   the primary product and wins that trade. */
	narrowAt: 760,
	narrowSpan: 3.3,
	narrowFit: 0.18,
};

/*
 * THE TOUCH PROFILE (P14) — three numbers, and only numbers. No second engine, no branch in the loop.
 *
 * THE PRINCIPLE, the same one that governs the four cinematic runtimes (see scroll-weight.js): weight is
 * what makes a WHEEL feel like a camera, because a wheel arrives in steps and the spring is what turns a
 * staircase into a move. Under a finger there is no staircase — the browser is already tracking the hand
 * 1:1 on the compositor — so the same spring is not weight, it is the world running behind the hand. That
 * is what "alsof de site voor een muis is ontworpen" describes, and it is the reason the site can measure
 * a clean 60 fps and still feel like it is resisting.
 *
 * 1. `damp` 0.15 -> 0.42. Arithmetic, not taste: the per-frame coefficient's time constant is
 *    -16.7ms / ln(1 - k), so 0.15 is 103 ms (about 233 ms to cover 90% of a new target) and 0.42 is 31 ms
 *    (about 78 ms). 78 ms is under the threshold at which a delay is felt as a delay at all, so the coil
 *    starts and stops WITH the finger — while still being a spring, so the reading moment still settles
 *    square-on rather than snapping. Note this changes only the LAG, never the gain: the coil already
 *    travels exactly as far as the scrollbar (D-84).
 *
 * 2. `autoDelay` 1400 -> 2200 (P21). Touch USED to set `autoSpeed: 0` — the D-72 idle drift was switched
 *    off entirely under a finger, because content moving on its own straight after a gesture is
 *    indistinguishable from the page not having stopped where you put it. The owner's P21 instruction names
 *    touch explicitly ("als je iets hebt aangeraakt … moet er een automatische scroll komen"), so the
 *    auto-scroll now runs here too and the objection is answered with TIME rather than with absence: a
 *    momentum fling has to die out and the hand has to be genuinely off the glass before the page takes
 *    over. The mechanism it used to drag in with it — D-84's re-base, a programmatic JUMP landing after a
 *    gesture, which is what a mobile browser answers by re-animating its URL bar — no longer exists; a
 *    sub-pixel creep is not a jump.
 *
 * 3. `swayAmp` 3.4 -> 2.2 — REMOVED with the sway itself (PERF-007). The world's breath is now the CSS
 *    sky behind the coil, which is already viewport-relative and needs no per-profile amplitude.
 *
 * Applied at mount, and only when `(pointer: coarse)` — the PRIMARY input, so a laptop with a touchscreen
 * nobody uses keeps the pointer profile. Explicit `opts` still win, so the tuning harness is unaffected.
 */
const TOUCH_CFG = {
	damp: 0.42,
	autoDelay: 2200,
	/* ---- PERF-013: a phone is a different machine, and the delivery schedule should say so ----------
	   Neither of these changes what the coil LOOKS like — the geometry, the sizes, the grade and the
	   reading moment are all identical to the pointer profile. They change only how far ahead and how fast
	   photographs are fetched, which is where a phone is actually different: a narrower pipe, less memory,
	   and a CPU that has to decode every one of them.
	     loadAhead    2.6 -> 2.0   still roughly a winding and a half of look-ahead in each direction, so a
	                               photograph is still requested seconds before it can be seen; it simply
	                               does not keep a third winding warm that a phone would have to hold.
	     loadPerFrame 6 -> 4       fewer decodes competing for one slower main thread in any single frame.
	                               At 4 per frame a fast flick still releases 240 photographs per second,
	                               far more than the coil can travel past. */
	loadAhead: 2.0,
	loadPerFrame: 4,
};

const prefersCoarse = () =>
	typeof window !== 'undefined' &&
	typeof window.matchMedia === 'function' &&
	window.matchMedia('(pointer: coarse)').matches;

const clampUnit = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* sessionStorage key holding the exact coil scrollY the visitor left at when they opened a project, so the
   return from that project lands on the identical frame (Phase 3 / D-73). */
const RETURN_Y_KEY = 'tv-return-y';

/* ============================================================================================
 * THE AUTO-SCROLL IS OPT-IN (PERF-001, P22). See documenten/PERFORMANCE_OPTIMIZATION_CHANGELOG.md.
 *
 * P21/D-93 made the page travel by itself whenever the visitor had been still for `autoDelay`, and left
 * the control as a PAUSE. Measured at rest on the built site: 260 px of unrequested travel per four idle
 * seconds on desktop, 230 px on a 390 pt phone, and the 72 / 58 layouts that scrolling the document
 * forces along with it — on a page the visitor was, by definition, not touching. It is also the one thing
 * that made the coil's rAF loop impossible to halt: a page that is always moving always has work to do.
 *
 * The mechanism is UNCHANGED and so is its tuning. Only its default is inverted: the journey now begins
 * when the visitor asks for it, and the control is a START. The key is therefore an explicit opt-IN —
 * absent means off — so a session that has never pressed it never travels, and a visitor who has pressed
 * it keeps their choice across a project detour.
 * ============================================================================================ */
const AUTO_ON_KEY = 'tv-auto-on';

/* The input events that mean "there is a hand on this page", listened for on window so they are caught
   wherever in the document they happen (the coil is fixed; the scroll spacer is not the target). Passive
   throughout — none of them is prevented, this only observes that the visitor is driving. */
const autoInputEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

export function createTraverse(root, opts = {}) {
	// P14 — see TOUCH_CFG. Explicit opts still override, so the tuning harness reaches every value.
	const cfg = { ...CFG, ...(prefersCoarse() ? TOUCH_CFG : null), ...opts };
	const stage = root.querySelector('[data-tv-stage]');
	const nodes = Array.from(root.querySelectorAll('[data-tv-work]'));
	if (!stage || !nodes.length) return null;


	const mkNode = (el, i) => ({
		el,
		i,
		ar: parseFloat(el.dataset.ar) || 1.5,
		visible: false,
		w: 0,
		h: 0,
		theta0: 0, // this work's own centre angle on the ribbon, set in measure()
		delta: 0, // the arc it occupies, set in measure()
		hoverF: 0, // 0..1 eased hover amount (pointer devices only)
		/* PROJECT RECOGNITION (Phase 4, D-74) — a purely additive, opt-in flag. A SERIES cover (a complete
		   project) hangs a whisper nearer and catches a little more light at its reading moment than a loose
		   work, so "here a body of work begins" is felt spatially, not only read in the caption. This is a
		   LIGHT/SCALE grade — the same family as readBright/readScale — never geometry, camera or physics, and
		   it is 0 for every loose work, so the frozen coil is byte-identical wherever no series cover is
		   present. Read from the template's data-kind so the runtime needs no portfolio knowledge. */
		isSeries: el.dataset.kind === 'series',
		/* P9 (D-80): true while this work's srcset is stashed in data-tv-srcset by the template's parse-time
		   deferral, i.e. while it is too far along the ribbon to be worth fetching. See loadIfNear(). */
		deferred: !!el.querySelector('[data-tv-srcset]'),
		sizeHint: '', // last `sizes` written, so measure() can be idempotent
		/*
		 * WHERE THE LIGHT GRADE IS APPLIED, AND WHY IT IS NOT THIS ELEMENT (P10 / D-81, kept at P15).
		 *
		 * A CSS `filter` on an element forces Chrome to allocate a render surface for it, and when that same
		 * element also carries a transform that changes every frame, the surface is re-rasterised in SCREEN
		 * SPACE on every one of those frames at device resolution. MEASURED on the built page in headful
		 * Chrome at 1440x900, dpr 2, scrolling continuously:
		 *
		 *     engine's own dynamic filter on .tv-work   median 33.4ms   p95 51ms    (~30fps)
		 *     a STATIC blur(7px) on .tv-work            median 32.3ms   p95 50ms    (~30fps)
		 *     the same STATIC blur(7px) on .tv-work img median 16.7ms   p95 17.7ms  (60fps)
		 *     no filter at all                          median 16.7ms   p95 17.7ms  (60fps)
		 *
		 * The static case is the proof: the blur cost the same when it never changed, so the expense was never
		 * the blur being recomputed — it was the filtered surface being redrawn because the element under it
		 * had moved. The colour matrix is free; the render surface is not.
		 *
		 * P15 REMOVES THE BLUR ALTOGETHER (see `backDim` in CFG), so only the colour matrix is left — and it
		 * stays one level in, on the <img>, where it is a per-pixel operation on a box that carries no
		 * transform of its own and is rasterised once in local space. The `grade` element and the second
		 * `filter` property that used to carry the depth of field are gone with it: one filter string, on one
		 * element, changed only when its own quantised value changes.
		 */
		tone: el.querySelector('img') || el.querySelector('picture') || el.querySelector('.media') || el,
		/* Last values written, so an unchanged frame writes nothing at all. Every one of these is a style
		   invalidation on a subtree, and a custom property is an invalidation on the subtree that reads it —
		   with the coil nearly still (the idle drift moves it a few thousandths of a work per frame) most of
		   them do not change from frame to frame, and re-writing them was pure invalidation for no pixels. */
		lastTone: null,
		lastOpacity: null,
		lastZ: null,
		lastCap: null,
		lastGold: null,
	});
	const works = nodes.map(mkNode);

	/* LEAD-INS — decorative clones that complete the coil ABOVE the crown (owner: "de spiraal loopt boven
	   het begin nog enkele foto's door … dienen alleen om de coil visueel compleet te maken. Later komen ze
	   opnieuw volledig langs"). They are server-rendered from works that appear LATER in the journey, are
	   aria-hidden and unfocusable, count for nothing (not in `span`, the journey, keyboard nav or the helix
	   report), and are placed at NEGATIVE ribbon angle so at rest they fill the sky over the first work.
	   They ride up and out as the journey begins and never return; their real originals still get their full
	   reading moment further down. */
	const leads = Array.from(root.querySelectorAll('[data-tv-lead]')).map(mkNode);

	/* THE COIL. The ribbon is FIXED IN SPACE and fixed on screen; only `journey` moves, and it moves the
	   photographs ALONG the ribbon. Work i sits at ribbon parameter t = i − journey:
	     θ = θ₀ − φ(journey),  X = R·sin θ,  Z = R·cos θ,  Y = −k·θ
	   Its normal is radial, so it carries rotateY(θ). At θ = 0 that is rotateY(0) — square on, undistorted,
	   dead centre, at the nearest point of the coil. The reading moment is not arranged; it is where the
	   curve already goes. */
	let journey = 0; // in works
	let span = Math.max(works.length - 1, 1);
	let target = 0;
	let vw = 0;
	let vh = 0;
	let safe = { w: 0, h: 0 };
	let narrow = false;
	let R = 0; // coil radius, px
	let D = 0; // camera distance from the axis, px — also the CSS `perspective`
	let k = 0; // rise per RADIAN of coil angle, px  (= pitch / 2π)
	let readScale = 1; // D/(D−R): how much perspective magnifies the reading moment
	let liveY = 0; // |y| beyond which a work has ridden off the frame and is culled
	let outroPx = 0; // px of scroll in the ending zone after the last work, set in measure()
	let focused = null;
	let running = false;
	let frame = 0;

	/* ---- the frame loop's own state (PERF-007) ---- */
	let viewportEl = null; // the perspective host; renderOutro hides it at the hand-off
	let lastInput = 0; // timestamp of the last visitor input, for the auto-scroll's delay
	let lastT = 0;
	/* THE LOOP SLEEPS. `awake` is true only while there is something left to move. Every input path calls
	   wake(); tick() calls sleep() the moment every eased value has arrived. See tick(). */
	let awake = false;
	/* ---- the auto-scroll (P21, see CFG) ---- */
	let autoLife = 0; // 0..1 eased auto-scroll amplitude; ramps up over autoRamp, drops to 0 on any input
	let autoRun = false; // true while the engine is the one moving the page
	let autoY = 0; // the engine's own fractional scroll position (window.scrollY is an integer)
	let autoSelfY = -1; // the exact value last written, so our own scroll event is not mistaken for a visitor
	/* PERF-001: starts TRUE. The page does not travel by itself until the visitor presses the control, and
	   the choice persists for the session (AUTO_ON_KEY). */
	let autoPaused = true;
	let autoBtn = null; // that control, if the page provides one
	let npObserver = null; // watches <body class> so the loop can wake when the lightbox closes (PERF-007)
	/* When the runtime started, so the image look-ahead can open narrow and widen (see `loadAheadFirst`). */
	let mountedAt = 0;
	let releaseBudget = 0; // PERF-008: photographs still allowed to start loading this frame
	let pendingRelease = false; // …and whether the cap stopped one, so the loop keeps running
	let outro = 0; // 0..1 end-of-journey dissolve, eased toward outroTarget in tick()
	let outroTarget = 0; // 0..1 raw ending position read from the outro scroll zone
	let hovered = null; // the work element the pointer is currently resting on
	let canHover = false; // true only on (hover:hover) and (pointer:fine) devices

	/* ---- image delivery ------------------------------------------------------------------------ */

	/*
	 * P9 (D-80) — TELL THE BROWSER THE TRUTH, ON THE ELEMENT IT ACTUALLY READS.
	 *
	 * The runtime has always computed each work's true presented width and written it to `img.sizes`. That
	 * write had no effect: <Media> renders an astro:assets <Picture>, so the candidate the browser actually
	 * selects from is the FIRST MATCHING <source> (AVIF, then WebP) — the <img> is only the last-resort
	 * fallback. Its `sizes` was therefore still the server-rendered no-JS hint (92vw / 62rem). Measured on
	 * the built site: a panel presenting at 339 CSS px on a 1440×900 desktop was served the 1700w derivative,
	 * and at 241 CSS px on a 390pt phone the 1300w one — roughly a 6× pixel overdelivery on every photograph
	 * in the coil. Writing the same honest number to every <source> as well is the whole fix.
	 *
	 * `readScale` is included deliberately: the number states the width at the work's READING MOMENT (its
	 * nearest, perspective-magnified frame), not its width at rest, so the one frame the traverse exists to
	 * deliver is never upscaled.
	 */
	function statePresentedWidth(w, width) {
		const hint = `${Math.ceil(width * readScale)}px`;
		if (w.sizeHint === hint) return; // idempotent: measure() runs on every resize
		w.sizeHint = hint;
		const pic = w.el.querySelector('picture');
		if (pic) for (const s of pic.querySelectorAll('source')) s.sizes = hint;
		const img = w.el.querySelector('img');
		if (img) img.sizes = hint;
	}

	/*
	 * THE LOAD WINDOW — the coil's own cull, reused as a loading discipline.
	 *
	 * Every panel in the coil is absolutely positioned inside one fixed stage, so every panel's LAYOUT box
	 * sits inside the viewport whatever the camera is doing. Native `loading="lazy"` therefore considered
	 * the entire archive "in view" and fetched it at once: measured 47–56 of the 62 photographs, 3.0–3.4 MB,
	 * before the visitor had scrolled a pixel — while the engine was drawing only 12–14 of them. `visibility:
	 * hidden` (the cull) does not defer an image fetch; only an absent srcset does.
	 *
	 * So the template stashes the far works' `srcset` in `data-tv-srcset` at parse time, and the engine —
	 * which already knows exactly which works are alive — restores them as they approach. The window is the
	 * cull line times `loadAhead`, so a photograph is fetched well before it can be seen, and the restore is
	 * one-shot per work. Nothing is stashed without JavaScript or under reduced motion (the template gates
	 * it on the same conditions the engine mounts under), so the accessible document is untouched.
	 */
	/*
	 * P15 — FETCH PRIORITY BELONGS TO THE RESTORE, NOT TO THE MARKUP.
	 *
	 * The crown (the first three works and the first three lead-ins, which are what fills the frame at
	 * journey 0) used to carry `priority` in the template, i.e. `loading="eager"` + `fetchpriority="high"`.
	 * That is exactly right in intent and it could not work, because of the ORDER two things happen in:
	 * Chrome's preload scanner runs AHEAD of the parser, so it reached those <source> elements and started
	 * fetching them before the parse-time stash script — which is below 140 KB of markup — had run. It
	 * picked from the server-rendered `sizes`, which describes the no-JS column, so it asked for the 900w
	 * derivative of a panel that presents at ~284px; then the stash script removed the srcset, the browser
	 * re-selected, and the speculative request was cancelled. MEASURED on the built site: exactly six
	 * `net::ERR_ABORTED` image requests on every load of /portfolio/, one per priority image, every time.
	 *
	 * So `priority` is dropped from the coil's markup (nothing there is eager any more, and nothing is
	 * speculatively fetched at the wrong size) and the priority is applied HERE instead — at the instant the
	 * engine restores the srcset, which is the instant the fetch actually starts, and by which time the
	 * honest `sizes` is already on the element. Same intent, applied where it takes effect, and six wasted
	 * round-trips fewer.
	 */
	function loadIfNear(w, y) {
		if (!w.deferred) return;
		const ahead = performance.now() - mountedAt < cfg.loadRampMs ? cfg.loadAheadFirst : cfg.loadAhead;
		if (Math.abs(y) > liveY * ahead) return;
		/* PERF-008: at most `loadPerFrame` per frame. `pendingRelease` keeps the frame loop running so the
		   remainder is released on the next frames rather than waiting for the next gesture. */
		if (releaseBudget <= 0) {
			pendingRelease = true;
			return;
		}
		releaseBudget--;
		w.deferred = false;
		if (w.i < 3) {
			const im = w.el.querySelector('img');
			if (im) im.setAttribute('fetchpriority', 'high');
		}
		const pic = w.el.querySelector('picture');
		if (pic) {
			for (const s of pic.querySelectorAll('source[data-tv-srcset]')) {
				s.srcset = s.dataset.tvSrcset;
				s.removeAttribute('data-tv-srcset');
			}
		}
		const img = w.el.querySelector('img[data-tv-srcset]');
		if (img) {
			img.srcset = img.dataset.tvSrcset;
			if (img.dataset.tvSrc) img.src = img.dataset.tvSrc;
			img.removeAttribute('data-tv-srcset');
			img.removeAttribute('data-tv-src');
			/* DECODE BEFORE IT IS SEEN (PERF-008). A photograph that arrives decoded is painted on the frame
			   it is needed; one that arrives encoded is decoded ON the frame it is needed, on the main
			   thread, which is exactly where a long frame comes from on a page drawing a dozen photographs
			   at once. `decode()` asks the browser to do that work off the critical path and, where it is
			   supported, off the main thread entirely. It is advisory: the rejection path is empty on
			   purpose, because a failed decode simply means the normal path draws it as it always did. */
			if (typeof img.decode === 'function') img.decode().catch(() => {});
		}
	}

	/* SAFETY NET. If the engine never reaches a work (an unexpected runtime failure, a browser that refuses
	   the 3D field), no photograph may stay stashed. One idle pass after load restores anything still
	   deferred, so the worst case is the pre-D-80 behaviour, never a missing image. */
	function releaseAllDeferred() {
		/* The safety net is exempt from the per-frame cap (PERF-008): this runs when the coil is being
		   handed back to the accessible document, where every photograph simply has to be present. */
		releaseBudget = Infinity;
		for (const w of works) loadIfNear(w, 0);
		for (const L of leads) loadIfNear(L, 0);
		releaseBudget = 0;
	}

	/* ---- layout -------------------------------------------------------------------------------- */

	function measure() {
		vw = root.clientWidth;
		vh = window.innerHeight;
		const inset = Math.min(vw, vh) * cfg.margin;
		safe = { w: vw - inset * 2, h: vh - inset * 2 };

		/* THE COIL'S ABSOLUTE LENGTHS, all derived from one choice (R) and the measured ratios. */
		narrow = vw < cfg.narrowAt;
		R = safe.w * 0.5 * cfg.span * (narrow ? cfg.narrowSpan : 1);
		D = cfg.camDist * R;
		readScale = D / (D - R);
		const pitchPx = cfg.pitch * R;
		k = pitchPx / (Math.PI * 2); // rise per radian — this is what makes it a HELIX and not a ring

		/* THE CAMERA IS NOT A METAPHOR HERE. CSS puts the eye at `perspective` in front of the z = 0 plane,
		   and the coil's axis is ON that plane, so the CSS perspective value IS D. It has to be written from
		   here rather than left in the stylesheet: D scales with the viewport, and a stylesheet constant
		   would silently put the eye at the wrong distance on every screen but the one it was written for. */
		const viewport = root.querySelector('.tv-viewport');
		if (viewport) {
			viewport.style.perspective = `${Math.round(D)}px`;
			viewportEl = viewport;
		}

		/* ------------------------------------------------------------------------------------------
		 * THE RIBBON IS TILED, NOT STEPPED
		 * ------------------------------------------------------------------------------------------
		 * The reference recording gets a continuous ribbon for free, because every image in it is the
		 * same shape: equal cards at a constant angular step abut perfectly all the way round. Leo's
		 * archive is not one shape. Panoramas, squares and tall portraits at a CONSTANT angular step
		 * leave a hole wherever a portrait sits — measured on the first build of this geometry, a
		 * portrait filled 224px of a 507px slot, and the eye cannot join a ribbon with holes in it. That
		 * is how "one continuous spiral" degrades into "a scattered cloud", which is the one reading the
		 * brief rules out by name.
		 *
		 * So the angular step is NOT constant here: each work is given the arc ITS OWN CHORD subtends,
		 * and the works are laid head to tail around the cylinder.
		 *
		 *     w_i = √(A·ar_i)          equal AREA, so presence does not depend on orientation
		 *     δ_i = 2·asin(w_i / 2R)   the arc that chord actually spans — exact, not a small-angle guess
		 *     Φ_{i+1} = Φ_i + δ_i / fill
		 *
		 * Consecutive chords then meet end to end whatever the shapes are, and the ribbon is continuous
		 * BY CONSTRUCTION rather than by every photograph happening to be a landscape. The rise stays
		 * locked to the ANGLE (y = −k·θ), so this is still one exact circular helix — a wide work simply
		 * occupies more of it, which is what a wide work should do.
		 *
		 * Equal area is the D-66 finding kept intact: fitting works into a shared BOX made a portrait
		 * read at 10.3% of the viewport and a panorama at 66.3%, a 6.4× spread, so "the reading state"
		 * meant six different things. Equal area gives every work the same weight at its own moment.
		 */
		const readW = (safe.w * cfg.readCap) / readScale;
		const readH = (safe.h * cfg.readCap) / readScale;
		/* The tallest work must stay clear of the strand above it: works one turn apart sit at the same
		   depth, and a work taller than the pitch would be coplanar AND overlapping with its own
		   neighbour a revolution away — a depth tie with nothing physical to break it. */
		const maxH = Math.min(readH, pitchPx * cfg.pitchClear);

		/* ------------------------------------------------------------------------------------------
		 * HOW SIZE IS SHARED BETWEEN SHAPES — one exponent, because one rule cannot serve both screens.
		 * ------------------------------------------------------------------------------------------
		 *     w_i ∝ ar_i^fit        fit = 0.5 → equal AREA      fit = 0 → equal WIDTH
		 *                           fit = 1   → equal HEIGHT
		 *
		 * Equal area (fit = 0.5) is the D-66 finding and it is right on a desktop: a portrait and a
		 * panorama carry the same curatorial weight at their own moments. But it makes width scale with
		 * √ar, and this archive runs from a 1:1.5 portrait to a 5.5:1 panorama — a 4.6× spread in width.
		 * On a phone the panorama hits the safe box first and drags the whole scale down with it:
		 * measured at 390×844, the widest work read at 317px and a portrait at 110px, which is not a
		 * photograph any more. Raising the radius did not help, and could not: every length in the world
		 * scales with R together, so the ratio between shapes never moved (measured identical reading
		 * widths at R = 260, 338 and 416).
		 *
		 * So a narrow viewport flattens the exponent instead. At fit = 0.18 the spread falls from 4.6× to
		 * 1.4×, every work lands between roughly half and three-quarters of the screen width, and the
		 * shapes still differ — a panorama is still the widest thing on the ribbon, just no longer nine
		 * times the area of the portrait beside it. This is the same trade a justified row makes, and the
		 * blueprint decides it: the photograph is the primary product.
		 */
		const fit = narrow ? cfg.narrowFit : cfg.fit;
		let wUnit = Infinity;
		for (const w of works) {
			wUnit = Math.min(
				wUnit,
				readW / Math.pow(w.ar, fit), // no work may be wider than the reading box
				maxH / Math.pow(w.ar, fit - 1), // nor taller than its strand allows
			);
		}
		/* The area ceiling still applies on top, so an archive of small works on a tall screen cannot grow
		   until the coil is nothing but two photographs. */
		wUnit = Math.min(wUnit, Math.sqrt(readW * readH * cfg.readArea));

		/* Size one node (work or lead) to the shared unit, tell its <img> the true presented width, and
		   return the arc its chord subtends. Factored out so the decorative lead-ins are sized by exactly
		   the same rule as the works and can never drift to a different scale. */
		const sizeNode = (w) => {
			const width = wUnit * Math.pow(w.ar, fit);
			const height = width / w.ar;
			w.w = width;
			w.h = height;
			w.el.style.width = `${Math.round(width)}px`;
			w.el.style.height = `${Math.round(height)}px`;
			statePresentedWidth(w, width);
			return (2 * Math.asin(Math.min(width / (2 * R), 0.999))) / cfg.fill;
		};

		let phi = 0;
		for (const w of works) {
			const width = wUnit * Math.pow(w.ar, fit);
			const height = width / w.ar;
			w.w = width;
			w.h = height;
			w.el.style.width = `${Math.round(width)}px`;
			w.el.style.height = `${Math.round(height)}px`;

			/* `sizes` IS SET FROM THE GEOMETRY, NOT GUESSED IN THE TEMPLATE.
			   Equal-area tiling means the reading width depends on the work's own aspect ratio, and this
			   archive runs from a 1:1.5 portrait to a 5.5:1 panorama — measured at 1440×900 the reading
			   state ranges from 251px (17vw) to 726px (50vw). No single `sizes` string can serve that: one
			   value tuned for the average made the panorama present 726px of photograph against a 432px
			   derivative, a 1.68× upscale on the one frame the whole traverse exists to deliver. The
			   runtime already knows the exact presented width, so it states it, and the number cannot
			   drift from the geometry that produced it. The server-rendered `sizes` still describes the
			   no-JS document, which is a different and equally real layout. */
			statePresentedWidth(w, width);

			/* The arc this work's own chord subtends. asin is clamped because a single work wider than the
			   coil's diameter has no chord — that cannot happen after the area clamp above, but a future
			   tuning change should fail visibly rather than produce NaN transforms. */
			const delta = 2 * Math.asin(Math.min(width / (2 * R), 0.999)) / cfg.fill;
			w.delta = delta;
			w.theta0 = phi + delta / 2; // the work's own centre on the ribbon
			phi += delta;
		}

		/* THE LEAD-INS sit ABOVE the crown, laid head to tail going UP from θ = 0 (the top edge of the first
		   work), so at rest the coil already winds up out of frame instead of beginning from nothing. They
		   are given negative θ₀ and are otherwise placed by the same code as the works. */
		let up = 0;
		for (const L of leads) {
			const delta = sizeNode(L);
			L.delta = delta;
			L.theta0 = -(up + delta / 2);
			up += delta;
		}

		/* THE LIVE WINDOW. Nothing recedes to a vanishing point in this world — every work is at
		   essentially the same distance from the eye — so a work leaves not by getting small but by
		   RIDING OFF the top or bottom of the frame. The cull is therefore a vertical one, in pixels. */
		let tallest = 0;
		for (const w of works) tallest = Math.max(tallest, w.h * readScale);
		liveY = vh * 0.5 * cfg.edge + tallest * 0.5;

		const spacer = root.querySelector('[data-tv-scroll]');
		/* The spacer carries the works, one viewport of run-in, AND the outro zone, so the scrollbar stays
		   honest about the whole journey including its ending. */
		outroPx = vh * cfg.outroVh;
		if (spacer)
			spacer.style.height = `${Math.round(works.length * cfg.scrollPerWork + vh + outroPx)}px`;

		/* The one place the scroll range is allowed to cost a layout: right after the spacer that determines it
		   has been written. Everything downstream reads the cache (P10 / D-81). */
		refreshRange();
	}

	/* ---- the journey --------------------------------------------------------------------------- */

	/* The ribbon angle the journey currently sits at. `journey` is in WORKS (so the scrollbar, keyboard
	   paging and focus all keep counting in works), but the world is parameterised by ANGLE, and the two
	   are no longer proportional now that a wide work occupies more arc than a narrow one. Interpolating
	   between the two neighbouring works' own centres is what keeps the travel smooth across that: at any
	   integer journey the angle lands exactly on a work's centre, which is its reading moment. */
	function journeyAngle() {
		const n = works.length;
		const j = Math.min(Math.max(journey, 0), n - 1);
		const i = Math.floor(j);
		const f = j - i;
		if (i >= n - 1) return works[n - 1].theta0;
		return works[i].theta0 + (works[i + 1].theta0 - works[i].theta0) * f;
	}

	function place(w, phi0) {
		/* THE ONE GEOMETRY EXPRESSION IN THE WHOLE RUNTIME.
		   A point on a coil of radius R about a VERTICAL axis, plus the rotation that makes the work
		   tangent to that coil. Nothing here refers to the camera, because the camera never moves: it sits
		   at z = +D on the axis's own plane, which CSS applies for us as `perspective`. The ribbon is
		   therefore fixed on screen, frame after frame, and the only thing that changes is WHICH work is
		   at which angle — the photographs flow along a stationary curve.

		     θ = θ₀ − φ(journey)     X = R·sin θ     Z = R·cos θ     Y = −k·θ     facing = rotateY(θ)

		   At θ = 0 this is (0, 0, +R) with rotateY(0): dead centre, nearest point of the coil, square on
		   to the eye with zero foreshortening. The reading moment is not a special case in the code — it
		   is where the curve already goes, which is why it cannot drift out of true. */
		const theta = w.theta0 - phi0;
		/* DIRECTION: the coil DESCENDS. y = +k·θ (D-67 had −k·θ, which built the coil UPWARD from the first
		   work and made scrolling feel like rising into it, with photographs already above the start). With
		   +k·θ every work later in the sequence sits LOWER, so at the top of the page the first work is the
		   crown of the spiral with nothing above it, and scrolling carries the ribbon UP past the eye — the
		   unmistakable sense of travelling DOWN a stairwell. θ = 0 is still y = 0, so the reading moment is
		   unmoved and dead centre. */
		const y = k * theta;

		/* P9 (D-80): fetch this work's photograph while it is still well outside the frame, so it is present
		   before it can be seen. Cheap: one boolean per work per frame until it is loaded, then nothing. */
		if (w.deferred) loadIfNear(w, y);

		/* NEVER CULL THE FOCUSED WORK.
		   Culling sets visibility:hidden, and a hidden element cannot hold focus — the browser blurs it and
		   drops focus to <body>. Because focusing a work also starts the journey travelling toward it, the
		   work could be culled mid-travel, so a keyboard visitor was ejected from the world on the very
		   first Tab that reached it (measured: focus entered at hop 7 and was on <body> 1.6s later). The
		   focused work stays alive until it is blurred, wherever the ribbon has carried it. */
		/* `will-change` IS PAID FOR PER ELEMENT, NOT PER MOVING ELEMENT (P15). The stylesheet used to declare
		   `will-change: transform, opacity` on `.tv-work` unconditionally, which asks the compositor for a
		   layer for all 63 panels plus the lead-ins — for the whole life of the page, whether or not they are
		   in the frame. The engine already knows exactly which works are live (this cull), so the hint is
		   given to those and taken back from the rest. It is written only when visibility itself changes, so
		   it costs one extra style write per work per entry/exit, and never a per-frame one. */
		if (Math.abs(y) > liveY && w.el !== focused) {
			if (w.visible) {
				w.visible = false;
				w.el.style.visibility = 'hidden';
				w.el.style.willChange = 'auto';
				w.el.setAttribute('aria-hidden', 'true');
			}
			return;
		}
		if (!w.visible) {
			w.visible = true;
			w.el.style.visibility = 'visible';
			w.el.style.willChange = 'transform, opacity';
			w.el.removeAttribute('aria-hidden');
		}

		const x = R * Math.sin(theta);
		const z = R * Math.cos(theta);

		/* PRESENCE. Three gradings, none of which is where the spatial illusion comes from — freeze them all
		   and the coil, the rotation and the sweep are unchanged.
		     Depth: the reference's far side is markedly darker than its near side. Reads as darkening rather
		   than transparency because the ground behind is near-black.
		     Entrance/exit: a work leaves and arrives at the frame edges, not at a hard cull line — it fades
		   and defocuses over a vertical band so the centre of the frame is always the clear reading place.
		     Reading: the work square-on lifts its own light a touch, so the eye is drawn without a glow. */
		const depth = (z / R + 1) * 0.5; // 0 at the back of the coil, 1 at the front
		/* depthGamma shapes the falloff: raising the linear depth to a power >1 holds the near face bright
		   and drops the far face into shadow faster, which is what separates "a solid object with a lit
		   front and a dark back" from "a ring of evenly grey cards". */
		let o = cfg.farDim + (1 - cfg.farDim) * Math.pow(depth, cfg.depthGamma);

		/* ENTRANCE & EXIT — the vertical focus band. |y|/liveY is 0 at the reading row and 1 at the cull;
		   beyond edgeStart a work fades and softens as it rises in / rides out, so it ARRIVES and DEPARTS
		   rather than switching on and off. smoothstep keeps both ends of the gesture gentle. */
		const ay = Math.abs(y) / liveY;
		let edgeSoft = 0; // 0 in the clear band, → 1 at the cull
		if (ay > cfg.edgeStart) {
			const t = Math.min((ay - cfg.edgeStart) / (1 - cfg.edgeStart), 1);
			edgeSoft = t * t * (3 - 2 * t);
			o *= 1 - edgeSoft;
		}

		/* READING EMPHASIS — the moment. readT is 1 at square-on and eases to 0 across readFalloff; the lift
		   is brightness/contrast/saturation and a 3% scale, all in the work's own light and plane. */
		const readT = Math.max(0, 1 - Math.abs(theta) / cfg.readFalloff);
		const read = readT * readT * (3 - 2 * readT);
		const hv = w.hoverF; // eased hover amount (0 unless a pointer is resting on this work)

		/* NEIGHBOUR HIERARCHY BY LIGHT (D-72 rev.2, and since P15 the ONLY hierarchy there is). `off` is 0 at
		   square-on and 1 once a work has turned sharpFalloff away; `turn` is its smoothstep. The whole FRONT
		   hemisphere is razor sharp and always was — the hero is distinguished from its crisp neighbours purely
		   by LUMINANCE: a front work dims as it turns away (`neighborDim`, x depth so it only touches the front
		   strand). The reading card is theta=0 -> turn=0 -> full brightness. */
		const off = Math.min(Math.abs(theta) / cfg.sharpFalloff, 1);
		const turn = off * off * (3 - 2 * off);
		const neighborLight = 1 - turn * cfg.neighborDim * depth;

		/* ENTRANCE & EXIT BY DEPTH (D-72). A work near the cull recedes on translateZ (`edgeSink`) and fades
		   (edgeSoft already dimmed the opacity above), so it ARRIVES from depth as it rises to centre and
		   DEPARTS into depth as it rides off — travel, not a pop, and without any defocus. */
		const edgeSink = edgeSoft * cfg.edgeSink;

		/* THE BACK OF THE COIL FALLS INTO SHADOW — the replacement for the depth of field (P15). `backAmt` is 0
		   across the entire front hemisphere (z >= 0: front-facing AND side works) and ramps to 1 at the very
		   back, so a work keeps all of its light until it has turned past the side and only the genuine back
		   darkens. Together with the opacity grade above this is what stops a BACKFACE — which presents its
		   photograph mirrored — from ever reading as a backwards picture: measured on the render, a fully-turned
		   work sits at opacity 0.20 x brightness 0.42, about 8% of the reading work's luminance. Present as
		   depth, unreadable as a picture. It rides in the same colour matrix as everything else below, so it
		   costs nothing beyond the multiply it already does. */
		const backAmt = Math.max(0, -z / R);
		const backLight = 1 - Math.pow(backAmt, cfg.backGamma) * cfg.backDim;
		/* SERIES LIFT (Phase 4, D-74). 0 for every loose work; for a series cover it rides on `read`, so the
		   extra light and scale ease in exactly as the cover turns square-on and out as it turns away. */
		const seriesRead = w.isSeries ? read : 0;
		/* THE COLOUR MATRIX — the whole grade now, and cheap: a per-pixel operation on an untransformed box, no
		   render surface anywhere. Quantised to 1% (two decimals, not three): a 1% step in a slow temporal
		   luminance ramp is far below the eye's threshold, and it cuts the number of style writes by roughly an
		   order of magnitude. */
		/* ============================================================================================
		 * THE GRADE, AND WHY MOST WORKS NOW CARRY NO FILTER AT ALL (PERF-009 / P22)
		 *
		 * THE HIERARCHY IS UNCHANGED: the reading work is the brightest, richest plane on the coil; a front
		 * neighbour loses light as it turns away; the back of the coil falls into shadow. What changes is
		 * which CSS property carries the two DIMMING terms.
		 *
		 * `neighborLight` and `backLight` are both pure darkening — they only ever multiply light away. Over
		 * this world's near-black ground, darkening a photograph with `filter: brightness(b)` and letting a
		 * little more of the ground show through with `opacity` are the same picture: there is essentially
		 * nothing behind the panel but the abyss. So both terms are folded into the opacity that is ALREADY
		 * being written on every work, and the filter is left carrying only the LIFT at the reading moment —
		 * brightness, contrast and saturation on the one photograph the traverse exists to present, plus the
		 * few degrees either side of it.
		 *
		 * MEASURED: active `filter` values on /portfolio/ fall from 18 to 3 on desktop and 21 to 3 on mobile,
		 * with the A/B of the rendered page reported in the changelog (PERF-009).
		 *
		 * The reading guarantee is untouched: at theta = 0 both dimming terms are exactly 1, so the hero's
		 * opacity is exactly what it always was and its lift is exactly what it always was.
		 * ============================================================================================ */
		const dim = neighborLight * backLight;
		const lift = 1 + read * cfg.readBright + seriesRead * cfg.seriesReadBright + hv * cfg.hoverBright;
		const tone = [];
		if (Math.abs(lift - 1) > 0.002) tone.push(`brightness(${lift.toFixed(2)})`);
		if (read > 0.002) {
			tone.push(`contrast(${(1 + read * cfg.readContrast).toFixed(2)})`);
			tone.push(`saturate(${(1 + read * cfg.readSat + seriesRead * cfg.seriesReadSat).toFixed(2)})`);
		}
		const toneStr = tone.length ? tone.join(' ') : '';
		if (toneStr !== w.lastTone) {
			w.lastTone = toneStr;
			w.tone.style.filter = toneStr;
		}

		/* translate(-50%,-50%) is leftmost, so it is applied LAST, in the parent's flat space — it centres
		   the element without ever passing through the rotation. rotateY then scale are rightmost, applied
		   FIRST, in the work's own plane about its centre: the reading scale never foreshortens or clips, and
		   any hover lift rides on z as a step toward the camera (translateZ), not a bolted-on CSS zoom.
		   edgeSink subtracts from z so an arriving/departing work sits deeper in the world. */
		const zLift = z + hv * cfg.hoverLift - edgeSink;
		const scale = 1 + read * cfg.readScale + seriesRead * cfg.seriesReadScale;
		w.el.style.transform =
			`translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${zLift.toFixed(1)}px) ` +
			`rotateY(${((theta * 180) / Math.PI).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
		/* PERF-009: the two dimming terms ride here now instead of in a `filter`. */
		const op = (o * dim).toFixed(3);
		if (op !== w.lastOpacity) {
			w.lastOpacity = op;
			w.el.style.opacity = op;
		}

		/* PAINT ORDER IS JUST DEPTH — the reading moment is the nearest point of the whole coil, so it is in
		   front of every other work by physics (D-66's override is deleted, not disabled). A hovered work
		   gets a large lift so it clears its neighbours while raised. */
		/* z-index is a PAINT-ORDER change, so re-writing it re-sorts the stacking context even when the value
		   is identical. Gated, and quantised to 200 steps of depth rather than 1000 — a tenth of a percent of
		   the coil's depth cannot change which of two works is in front, and the coarser step means a work
		   drifting slowly holds its value for many frames instead of nudging the paint order every one. */
		const zi = 1000 + Math.round(depth * 200) * 5 + (hv > 0.01 ? 3000 : 0);
		if (zi !== w.lastZ) {
			w.lastZ = zi;
			w.el.style.zIndex = String(zi);
		}

		/* The caption belongs to the reading moment only, and it fades as the work turns away or leaves the
		   clear band: past a few degrees the text is foreshortened enough to stop being worth reading. */
		/* Quantised to 2% (P15, was 1%). Every custom-property write invalidates the computed style of the
		   subtree that reads it, and this one is written on every live work; a 2% step in an opacity ramp is
		   invisible and roughly halves the number of invalidations on a travelling coil. */
		const capO = Math.max(0, 1 - Math.abs(theta) / 0.3) * (1 - edgeSoft);
		const capStr = (Math.round(capO * 50) / 50).toFixed(2);
		if (capStr !== w.lastCap) {
			w.lastCap = capStr;
			w.el.style.setProperty('--tv-cap-o', capStr);
		}

		/* THE GOLD MOUNT LINE (P8.5 / D-76) — gold on this page now means "square-on, at the reading
		   position", and nothing else (see traverse.css for what it replaces). Its own narrow smoothstep, so
		   it is genuinely absent between works and blooms only as one settles; multiplied by (1 - edgeSoft)
		   so a work arriving into or departing from the clear band never carries it, and gated on the FRONT
		   hemisphere (z ≥ 0) so a backface at the far side of the coil can never light up. One extra custom-
		   property write per work per frame, on a property that only feeds an opacity — compositor work. */
		/* P8.6 (D-77): "verschijnt langzaam, verdwijnt langzaam." There is no time-based easing available
		   here — `--tv-gold` is written every frame from the work's own angle, and a CSS transition would
		   fight the frame loop — so the slowness has to live in the ENVELOPE's shape. Two changes, both
		   about the ends of the fade rather than its width:
		     · the window widens 0.14 → 0.22 rad (8° → 12.6°), so the light has real travel to arrive over.
		       It stays comfortably inside `readFalloff` (0.30), which is what keeps it a statement about
		       one photograph rather than a wash over the strand — measured live, at most one work carries
		       more than 0.05 of it at any moment;
		     · smoothstep becomes SMOOTHERSTEP (6t⁵−15t⁴+10t³). Its first AND second derivatives are zero
		       at both ends, where smoothstep's second derivative is not — which is precisely the difference
		       between a light that switches on gently and one that blooms. */
		const goldT = Math.max(0, 1 - Math.abs(theta) / cfg.goldFalloff);
		const gold = z >= 0 ? goldT * goldT * goldT * (goldT * (goldT * 6 - 15) + 10) * (1 - edgeSoft) : 0;
		/* Quantised to 2% for the same reason as `--tv-cap-o` above: this is a per-work subtree invalidation
		   feeding a single opacity, and three decimals of it changed on literally every frame. */
		const goldStr = (Math.round(gold * 50) / 50).toFixed(2);
		if (goldStr !== w.lastGold) {
			w.lastGold = goldStr;
			w.el.style.setProperty('--tv-gold', goldStr);
		}
	}

	function render() {
		const phi0 = journeyAngle();
		releaseBudget = cfg.loadPerFrame;
		pendingRelease = false;
		/*
		 * THE LEAD-INS ARE PLACED FIRST (P13 / D-85), AND THE REASON IS IMAGE ORDER, NOT DRAWING ORDER.
		 *
		 * `place()` writes only styles, and depth alone decides what is in front (z-index is derived from
		 * the coil's own geometry), so the order these two loops run in cannot change a single pixel. What
		 * it does change is the order in which `loadIfNear` restores each panel's srcset — and therefore the
		 * order the browser queues the photographs.
		 *
		 * On the very first frame the engine releases every panel inside its opening look-ahead at once:
		 * roughly twenty-five requests, against six connections. The lead-ins were released LAST, because
		 * they were placed last — yet three of them are in the set the entrance curtain waits on (D-84: they
		 * are what fills the top of the frame at journey 0). MEASURED on the built site, 390pt phone at
		 * dpr 3, cold cache, 1.6 Mbps, CPU throttled 4x: the lead photographs were not even requested until
		 * 3.26s and the last one landed at 4.96s, so the overture ran to its 4.2s hard cap on every cold
		 * visit. They were queued behind nineteen photographs nobody was waiting for.
		 *
		 * Placing them first puts the crown's own imagery at the head of the queue, which is the only thing
		 * the arrival is actually blocked on.
		 */
		for (const L of leads) place(L, phi0);
		for (const w of works) place(w, phi0);
		renderOutro();
	}

	/* THE ENDING. After the last work has held its reading moment the outro zone dissolves the whole coil —
	   it recedes a little and fades — and once it is essentially gone the fixed camera surface is hidden so
	   the site footer, which flows in the document right after the scroll spacer, is entirely the visitor's.
	   Decreasing intensity, then a clean hand-off, then the footer: an ending rather than a page that simply
	   runs out of coil over the top of the footer. */
	function renderOutro() {
		if (!stage) return;
		const e = outro * outro * (3 - 2 * outro); // smoothstep
		if (e < 0.0005) {
			if (stage.style.opacity) {
				stage.style.opacity = '';
				stage.style.transform = '';
			}
		} else {
			stage.style.opacity = (1 - e).toFixed(3);
			stage.style.transform = `translateY(${(-e * vh * 0.08).toFixed(1)}px) scale(${(1 - e * 0.05).toFixed(4)})`;
		}
		/*
		 * THE HAND-OFF IS GEOMETRIC, NOT ONLY ANIMATED (P15).
		 *
		 * `.tv-viewport` is `position: fixed; inset: 0` — a full-screen surface that sits OVER whatever the
		 * document has scrolled up underneath it, and the contact invitation and the site footer both live
		 * below this root. Hiding it on `e > 0.985` alone makes that hand-off depend on a spring settling,
		 * and a spring can be lagging for any number of reasons: a fling straight to the foot of the page, a
		 * restored scroll position, a viewport resize mid-ending, a slow frame. Whenever it lags, the coil is
		 * still being drawn on a screen the CTA is already on — which is exactly the "de spiraal loopt over
		 * de CTA/footer heen" the owner reports, and no amount of tuning the spring can make it impossible.
		 *
		 * So the surface is ALSO hidden the moment the traverse's own box has finished passing the viewport:
		 * once `root`'s bottom edge is at or above the bottom of the screen, everything below it in the
		 * document is on screen, and the fixed camera has no business being there. That is a hard structural
		 * guarantee (it cannot be lagged, overshot or raced), and it is not padding: nothing is moved, spaced
		 * or hidden that the reader was meant to see — the coil has already dissolved by then in the normal
		 * case, and this simply makes "already dissolved" true on every frame instead of nearly every frame.
		 *
		 * The reads are cached (`rangeTop` / `root.offsetHeight` refresh on measure), so this costs no layout.
		 */
		const passed = window.scrollY + vh >= rangeTop + rangeHeight - 1;
		if (viewportEl) viewportEl.style.visibility = e > 0.985 || passed ? 'hidden' : '';
	}

	/* ---- input --------------------------------------------------------------------------------- */

	/* THE TRAVERSE'S OWN SCROLL RANGE.
	   The first build mapped scroll through `root.scrollHeight` while the browser scrolls the DOCUMENT.
	   The site header and footer live outside `root`, so the two denominators differ and the camera drifted:
	   measured, works arrived at scale 0.90 (155 world units short) or overshot to 1.07 — the reading moment
	   never actually occurred for 24 of 55 works. The camera must be driven by the range the traverse
	   genuinely occupies in the document, which also makes the runtime immune to anything added above or
	   below it later. */
	/*
	 * THE RANGE IS MEASURED WHEN THE LAYOUT CHANGES, NOT WHEN THE VISITOR SCROLLS (P10 / D-81).
	 *
	 * `scrollRange()` reads `offsetTop` up the offsetParent chain and `root.offsetHeight`, and it used to run
	 * inside `readScroll()` — i.e. on EVERY scroll event. Scroll events are delivered before the frame's rAF
	 * callback but after the previous frame's style writes, and the engine writes custom properties on every
	 * live work, so each of those reads forced a synchronous style recalc of the whole coil before the layout
	 * value could be returned. MEASURED on the built page at 1440×900: 1.1–1.9ms of forced work per scroll
	 * event on an unthrottled machine, i.e. 5–8ms on a 4× slower one, spent before the engine had done
	 * anything — and a fast wheel or trackpad delivers more than one scroll event per frame.
	 *
	 * Neither number can change without a layout change, so both are cached and refreshed from `measure()`
	 * (start, resize, orientation change) and once more on `load`. `readScroll()` is now pure arithmetic on
	 * `window.scrollY` and touches no layout at all.
	 */
	let rangeTop = 0;
	let rangeUsable = 1;
	let rangeHeight = 0; // root.offsetHeight, cached — renderOutro's geometric hand-off reads it every frame

	function refreshRange() {
		let top = 0;
		for (let el = root; el; el = el.offsetParent) top += el.offsetTop;
		rangeTop = top;
		rangeHeight = root.offsetHeight;
		rangeUsable = Math.max(rangeHeight - window.innerHeight, 1);
	}

	function scrollRange() {
		return { top: rangeTop, usable: rangeUsable };
	}

	function readScroll() {
		/* IS THIS SCROLL OURS? (P21). The engine moves the page itself while the visitor is idle, so a scroll
		   event is no longer proof that the visitor did something. Ours lands within a pixel of the value we
		   asked for one frame ago; anything else is the visitor and takes the wheel immediately. This is the
		   BACKUP path — the direct input listeners below release the auto-scroll before a scroll event even
		   arrives — but it is the only one that catches a SCROLLBAR DRAG, which dispatches no pointer event
		   to the document at all. */
		if (autoRun && Math.abs(window.scrollY - autoSelfY) <= 2) {
			// our own creep: do not reset the idle timer, or the auto-scroll would cancel itself every frame
		} else {
			releaseAuto(); // also wakes the loop (PERF-007)
		}
		/* A scroll that reached us without any input event at all — a scrollbar drag, an anchor, a restored
		   position, `scrollTo` from another module. `releaseAuto` has already woken the loop in every other
		   case and `wake()` is idempotent, so this is the belt to that braces. */
		wake();
		const top = rangeTop;
		const usable = rangeUsable;
		const scrolled = Math.max(window.scrollY - top, 0);
		/* The journey maps to the WORKS portion of the spacer; the trailing outro portion drives the ending
		   instead of the camera, so the last work holds its reading moment while the coil dissolves. */
		const worksUsable = Math.max(usable - outroPx, 1);
		target = Math.min(scrolled / worksUsable, 1) * span;
		outroTarget = Math.min(Math.max((scrolled - worksUsable) / Math.max(outroPx, 1), 0), 1);
	}

	/* ADAPTIVE DAMPING. A single coefficient cannot serve both gestures the visitor actually makes. At
	   cfg.damp a continuous scroll has exactly the weight we want, but a TELEPORT — dragging the scrollbar,
	   an anchor, restored scroll on reload — needs ~50 frames to settle, during which the world is visibly
	   wrong: measured, work 0 rendered at scale 1.41 and clipped nearly a second after arriving. Damping
	   rises with the size of the jump, so a drag stays weighty and a teleport arrives. */
	function tick(now) {
		if (!running) return;
		if (!lastT) lastT = now;

		/* NAVIGATION-STATE GUARD (Phase 3 integration, D-73). While the near plane (lightbox) owns the screen,
		   the coil HOLDS its journey exactly. Without this the idle auto-drift keeps advancing `journey` behind
		   the opaque overlay, so a visitor who lingers a moment in the lightbox returns to a DIFFERENT frame on
		   close — breaking "sluiten → exact dezelfde foto" (§7.1, hard requirement 2). scrollY is never touched,
		   so the coil resumes on the identical frame the visitor left. This is a pause, not a geometry change:
		   the world's one rule, the camera and the physics are all untouched. `lastT`/`lastInput` are advanced so
		   the first resumed frame steps by one frame's dt and no idle drift has accrued during the pause. */
		if (document.body.classList.contains('is-np-open')) {
			/* PERF-007: this used to keep scheduling frames so the guard could be re-tested every 16 ms —
			   a full-rate loop behind an opaque overlay, drawing a coil nobody can see. It now SLEEPS, and
			   the body-class observer installed in start() wakes it the moment the near plane closes. The
			   hold itself is unchanged: `journey` is not advanced, so "sluiten → exact dezelfde foto"
			   (§7.1, hard requirement 2) is still guaranteed by not running rather than by running idle. */
			lastT = 0;
			lastInput = now;
			sleep();
			return;
		}

		/* real seconds between frames, clamped so a backgrounded tab's catch-up frame — or the first frame
		   after the loop has been asleep — cannot make an eased value leap. */
		const dt = Math.min((now - lastT) / 1000, 0.05);
		lastT = now;

		/* THE SPRING. `target` is now the whole story: the auto-scroll (P21) moves the PAGE, so its travel
		   arrives here through the same `readScroll()` path a wheel does and needs no addend of its own.
		   (D-72's `autoOffset` used to be added in at this line — see the CFG note for why it is gone.) */
		const effTarget = Math.min(Math.max(target, 0), span);
		const delta = effTarget - journey;
		const jump = Math.abs(delta); // already in works
		if (jump < 0.0012) {
			journey = effTarget;
		} else {
			const kFrame = Math.min(cfg.damp * (1 + jump * jump * 0.5), 0.55);
			/* THE SPRING IS NORMALISED TO REAL TIME, NOT TO FRAMES (P10 / D-81).
			   `journey += delta * kFrame` every frame makes the camera's weight a function of the DISPLAY, and
			   worse, a function of how well the page happens to be running. On a 120Hz screen the coil settled
			   in half the time it was tuned for; on a machine dropping to 30fps the time constant DOUBLED, so a
			   frame-rate problem turned itself into a latency problem on top — the two defects the owner reported
			   are the same defect compounding. Converting the per-frame coefficient to a per-second decay makes
			   the weight identical at 30, 60, 90 and 144Hz, which also means the responsiveness fixes below can
			   no longer be undone by a slow frame. */
			const k = 1 - Math.pow(1 - kFrame, dt * 60);
			journey += delta * k;
		}

		/* THE ENDING eases toward the scroll-derived target so a fling to the bottom dissolves the coil over
		   a beat instead of snapping it out. */
		/* THE ENDING eases toward the scroll-derived target so a fling to the bottom dissolves the coil over a
		   beat instead of snapping it out — normalised to REAL TIME, not to frames (P15). `outro += d * 0.12`
		   every frame is the same defect D-81 fixed for the main spring: on a 120Hz display the dissolve took
		   half as long as it was tuned for, and on a machine dropping frames it took twice as long — i.e. the
		   coil lingered longest over the arriving CTA exactly when the machine was least able to draw it. */
		const kOutro = 1 - Math.pow(1 - 0.12, dt * 60);
		outro += (outroTarget - outro) * kOutro;
		if (Math.abs(outroTarget - outro) < 0.002) outro = outroTarget;

		/* HOVER (pointer devices): each work's lift eases toward 1 while the pointer rests on it, 0 otherwise,
		   so the response has weight rather than a hard toggle. */
		if (canHover) {
			for (const w of works) {
				const tgt = w.el === hovered ? 1 : 0;
				if (w.hoverF !== tgt) {
					w.hoverF += (tgt - w.hoverF) * cfg.hoverEase;
					if (Math.abs(tgt - w.hoverF) < 0.002) w.hoverF = tgt;
				}
			}
		}

		/* `autoTick` reports whether the auto-scroll still needs frames — see `busy` below. It is not enough
		   to ask "is it running?": there is a window in which the delay has elapsed and it is ALLOWED to run
		   but has not accumulated any ramp yet, and a loop that sleeps through that window can never start.
		   (Measured on the first cut of PERF-007: pressing START did nothing at all, because wake() gives the
		   first frame after a sleep a dt of 0, so `autoLife` was re-armed and re-zeroed forever.) */
		const autoWants = autoTick(now, dt);

		render();
		/* INTEGRATION SEAM (Phase 3, D-73). One optional callback per frame, carrying the current journey (in
		   works), so the portfolio chrome — the wayfinding marker, the per-world ambient tint and the world-title
		   beats — reads the world from the SAME journey the coil is drawn from, without a second rAF that could
		   disagree. Guarded, so the engine is byte-identical for any caller that does not pass one, and it never
		   fires under reduced motion (the runtime is not mounted at all there). */
		if (cfg.onFrame) cfg.onFrame(journey, outro);

		/* ============================================================================================
		 * SHOULD THERE BE ANOTHER FRAME? (PERF-007)
		 *
		 * Every term in this world is now a function of SCROLL or of an eased value with a target. None of
		 * them is a function of time on its own any more (the camera sway was the last one — see CFG). So
		 * once every eased value has arrived at its target there is, literally, nothing left to draw, and
		 * the honest thing to do is stop. The next gesture calls wake().
		 *
		 * MEASURED before this change, on a page the visitor was not touching: 240 frames, 665 style
		 * recalculations and 72 layouts per four idle seconds.
		 *
		 * The thresholds are the same ones the code already used to snap each value to its target, so a
		 * loop can never sleep while something is still visibly moving: `journey` snaps at 0.0012 works,
		 * `outro` at 0.002, and a hover ease snaps at 0.002. `autoLife > 0` keeps the loop awake for the
		 * whole of an auto-scroll, which is correct — it IS moving the page.
		 * ============================================================================================ */
		let busy =
			journey !== effTarget ||
			outro !== outroTarget ||
			autoWants ||
			pendingRelease; // PERF-008: a capped release still owes frames
		if (!busy && canHover) {
			for (const w of works) {
				if (w.hoverF !== (w.el === hovered ? 1 : 0)) {
					busy = true;
					break;
				}
			}
		}
		if (busy) {
			frame = requestAnimationFrame(tick);
			return;
		}
		sleep();
		/* THE ONE THING THAT STILL HAS TO HAPPEN LATER. If the visitor has switched the auto-scroll ON, its
		   `autoDelay` has to be able to elapse while the page is perfectly still — and waiting for a
		   timestamp is not a reason to run a 60 Hz loop. One timer, set for exactly the remaining delay.
		   Not armed while a keyboard visitor is holding a work (that would re-arm every 1.4 s for nothing);
		   `focusout` wakes the loop, which re-arms it. */
		if (!autoPaused && cfg.autoSpeed > 0 && outroTarget < 0.001 && !keyboardHoldsWork()) {
			armAuto(Math.max(cfg.autoDelay - (now - lastInput), 60));
		}
	}

	/* One pending wake-up for the auto-scroll's delay. Cleared by wake() and by stop(), so it can never
	   outlive the runtime or stack up. */
	let autoArm = 0;
	function armAuto(ms) {
		clearTimeout(autoArm);
		autoArm = setTimeout(() => {
			autoArm = 0;
			wake();
		}, ms);
	}

	/* ---- the sleeping loop (PERF-007) ---------------------------------------------------------- */

	/* THE ONLY WAY A FRAME IS EVER SCHEDULED. Idempotent, so the half-dozen input paths that call it can do
	   so freely; `lastT = 0` makes the first frame after a sleep step by one frame's dt rather than by the
	   whole length of the sleep, which is what stops a value from leaping when the visitor comes back. */
	function wake() {
		if (autoArm) {
			clearTimeout(autoArm);
			autoArm = 0;
		}
		if (!running || awake || document.hidden) return;
		awake = true;
		lastT = 0;
		frame = requestAnimationFrame(tick);
	}

	function sleep() {
		awake = false;
		if (frame) cancelAnimationFrame(frame);
		frame = 0;
	}

	/* ============================================================================================
	 * THE AUTO-SCROLL (P21 / D-93). See the CFG note for the brief and for why this moves the page rather
	 * than the camera. One function, called once per frame from tick(), and one release path.
	 * ============================================================================================ */

	/* THE VISITOR TAKES THE WHEEL. Called from every input path — wheel, touch, pointer, key, and any scroll
	   event that is not the one we just wrote. Not a ramp-down: the moment there is a hand on the page the
	   engine is not moving it, on the same frame, with nothing left in flight to reconcile. */
	function releaseAuto() {
		lastInput = performance.now();
		autoRun = false;
		autoLife = 0;
		/* PERF-007: this is the hand arriving on the page, and it is the earliest point at which we know
		   the world is about to have something to do. Waking here rather than in the scroll handler means
		   the first frame of a gesture is already being drawn when the first pixel of scroll lands. */
		wake();
	}

	/* DOES A KEYBOARD VISITOR HOLD A WORK? Scrolling the page out from under a focused element is hostile
	   and risks WCAG 2.4.11, so an INDICATED focus inside the coil holds the auto-scroll.

	   It has to be the indicated kind, and this is not pedantry — it is the difference between the feature
	   working and not working. A mouse click on a photograph focuses its anchor, and closing the lightbox
	   deliberately RETURNS focus to it (Lightbox.astro, so the next Tab resumes at the photograph rather
	   than at the top of the document). A plain `focused !== null` test therefore latched after exactly the
	   interaction the owner named — "een foto lightbox heb geopend en weer sluit" — and the page never moved
	   again. MEASURED before this guard was narrowed: still at y=185 three seconds after close.

	   Two signals, both already maintained by the site: `data-focus-quiet` marks a focus a script moved for
	   a POINTER visitor (quiet-focus.js), and `:focus-visible` is the browser's own answer for everything
	   else. Either one saying "this was not the keyboard" is enough. */
	function keyboardHoldsWork() {
		if (focused === null) return false;
		const ae = document.activeElement;
		if (!ae || !focused.contains(ae)) return false;
		if (ae.hasAttribute('data-focus-quiet')) return false;
		try {
			return ae.matches(':focus-visible');
		} catch {
			return true; // a browser without :focus-visible: hold, which is the safe side
		}
	}

	/* @returns {boolean} true while this needs the frame loop to keep running (PERF-007). */
	function autoTick(now, dt) {
		if (cfg.autoSpeed <= 0) return false;

		/* WHEN THE PAGE MAY MOVE ITSELF. Every clause is a way of saying "the visitor is not holding it":
		   they have been still for autoDelay; they have not pressed the stop; no keyboard focus is resting on
		   a work; the spring has settled, so a teleport is not still arriving; and we are not already in the
		   ending. */
		const may =
			!autoPaused &&
			!keyboardHoldsWork() &&
			now - lastInput > cfg.autoDelay &&
			Math.abs(journey - target) < 0.06 &&
			outroTarget < 0.001;

		autoLife = clampUnit(autoLife + (may ? (dt * 1000) / cfg.autoRamp : -1));
		if (autoLife <= 0) {
			autoRun = false;
			/* `may` is the load-bearing part: the delay has elapsed and the page is about to start moving,
			   even though nothing has accumulated yet. Returning false here is what stalled the start. */
			return may;
		}

		/* THE LIMIT IS THE END OF THE WORKS, NOT THE END OF THE PAGE. The trailing outro zone dissolves the
		   coil into the contact invitation; arriving there is a departure and belongs to the visitor. */
		const worksUsable = Math.max(rangeUsable - outroPx, 1);
		const limit = rangeTop + worksUsable;

		if (!autoRun) {
			autoRun = true;
			autoY = window.scrollY; // pick up wherever they left it, to the pixel
		}
		/* Arrived at the end of the works: the ending belongs to the visitor, so stop asking for frames. */
		if (autoY >= limit) {
			autoRun = false;
			autoLife = 0;
			return false;
		}

		/* Speed in DOCUMENT PIXELS, derived from the same works↔scroll mapping readScroll() uses, so the
		   cadence is one work per (1 / autoSpeed) seconds at every viewport size. Smootherstepped by
		   `autoLife`, so the first pixel is as slow as the ramp implies rather than a step. */
		const a = autoLife * autoLife * (3 - 2 * autoLife);
		autoY = Math.min(autoY + cfg.autoSpeed * a * dt * (worksUsable / span), limit);

		const y = Math.round(autoY);
		if (y !== autoSelfY) {
			autoSelfY = y;
			/* `'instant'`, NOT the bare `window.scrollTo(0, y)` form: the site sets
			   html{scroll-behavior: smooth} (base.css), and `auto` inherits it — a smooth-scrolled sequence of
			   per-frame targets queues 60 competing animations a second, which is a page that fights itself
			   rather than one that creeps. Positional, instant, one value per frame. */
			window.scrollTo({ top: y, behavior: 'instant' });
		}
		return true;
	}

	/* PERF-007: `renderAmbient()` — the camera sway — lived here. See the note in CFG for what it did, why
	   its cost was a whole-subtree style invalidation on every frame, and what carries the world's life at
	   rest instead (the CSS sky behind the coil). To restore it, see the changelog entry PERF-007.
	   LIFE HOOK: per-work inertia would layer on here, added to each work's transform in place(). */

	/* Keyboard: focusing a work travels the camera to its reading moment. Native scroll does the moving,
	   so focus, scrollbar and camera can never disagree. */
	function focusWork(index, smooth = true) {
		const w = works[Math.min(Math.max(index, 0), works.length - 1)];
		if (!w) return;
		/* An intentional navigation to a specific work (keyboard focus, a wayfinding jump, a project return)
		   must land EXACTLY on that work, and must not be immediately walked off it. Releasing here restarts
		   the auto-scroll's own clock from this arrival, so the visitor gets the full autoDelay to look at
		   the thing they asked to be taken to. (P21: it also drops the stale `autoSelfY`, since the scroll
		   set below is not ours to recognise.) */
		releaseAuto();
		const { top, usable } = scrollRange();
		/* Map through the WORKS portion of the spacer, not the whole of it. readScroll() reserves the trailing
		   outro zone for the ending, so the journey spans `usable − outroPx`; mapping through the full `usable`
		   here overshoots every work's reading moment by i·outroPx/worksUsable — negligible at the crown but a
		   FULL WORK by the end of the coil, so a keyboard visitor landed on the next work's angle, foreshortened
		   (measured after D-70 added the outro: work 45 arrived at −39° instead of 0°). This matched the runtime
		   before the outro existed and was not updated with it; matching readScroll's denominator lands every
		   work exactly square-on again. */
		const worksUsable = Math.max(usable - outroPx, 1);
		/* `smooth` is the default (a single keyboard step reads well as a glide); a wayfinding JUMP passes
		   false, because gliding the camera across many works is the documented nausea source §5.2 rules out —
		   a jump must be instant and positional. `'instant'`, NOT `'auto'`: the site sets html{scroll-behavior:
		   smooth}, and `'auto'` resolves to that CSS value, so a jump was silently animating the whole way and
		   also landing imprecisely (it was measured mid-animation). `'instant'` overrides the CSS and lands the
		   coil on the exact work in one step, in agreement with the scrollbar. */
		window.scrollTo({ top: top + (w.i / span) * worksUsable, behavior: smooth ? 'smooth' : 'instant' });
	}

	/* Arrows move FOCUS, and focus moves the camera (via onFocusIn). Driving the camera directly instead
	   left the focused work behind the camera — measured at scale 1.84 and off-screen, so a keyboard visitor
	   was reading one work while the browser's focus sat on another. Moving focus keeps the two in sync by
	   construction rather than by two code paths agreeing. */
	function step(to) {
		const i = Math.min(Math.max(to, 0), works.length - 1);
		const el = works[i].el;
		el.style.visibility = 'visible';
		works[i].visible = true;
		el.removeAttribute('aria-hidden');
		const target = el.matches('a, [tabindex]') ? el : el.querySelector('a, [tabindex]') || el;
		target.focus({ preventScroll: true }); // onFocusIn travels the camera
	}

	function onKey(e) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		lastInput = performance.now(); // keyboard travel resets the auto-scroll's delay too
		wake();
		const cur = focused
			? works.findIndex((w) => w.el === focused)
			: Math.round(journey);
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			step(cur + 1);
			e.preventDefault();
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			step(cur - 1);
			e.preventDefault();
		} else if (e.key === 'Home') {
			step(0);
			e.preventDefault();
		} else if (e.key === 'End') {
			step(works.length - 1);
			e.preventDefault();
		}
	}

	function onFocusIn(e) {
		const el = e.target.closest('[data-tv-work]');
		if (!el) return;
		focused = el;
		el.style.visibility = 'visible';
		const w = works.find((x) => x.el === el);
		if (w) {
			w.visible = true;
			el.removeAttribute('aria-hidden');
			focusWork(w.i);
		}
	}

	function onFocusOut(e) {
		if (e.target.closest('[data-tv-work]') === focused) {
			focused = null;
			/* A keyboard visitor letting go of a work is the moment the auto-scroll may be re-armed, and the
			   arming happens at the foot of tick() — so the loop has to run one more frame to get there. */
			wake();
		}
	}

	/* CAPTURE THE RETURN POINT (Phase 3 / D-73). When the visitor follows a project card OUT of the coil, store
	   the exact scrollY they left at, so the project page's "Terug naar portfolio" link can restore that
	   identical frame (see start()). Only real project navigations are captured — never the lightbox anchors
	   (they carry data-lb-full and open the near plane in place) and never in-page jumps. Capture phase, so it
	   runs before the navigation begins. */
	function onProjectLink(e) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
		const a = e.target.closest && e.target.closest('a[href]');
		if (!a || a.hasAttribute('data-lb-full')) return;
		const href = a.getAttribute('href') || '';
		if (/^\/portfolio\/[^#?]/.test(href)) {
			try {
				/* The position to come BACK to is simply the scroll position (P21). It used to need a
				   correction term: D-72's drift sat BETWEEN the scrollbar and the world, so a visitor who
				   paused to look and then opened a project returned up to 0.9 works behind the photograph
				   they left. The auto-scroll moves the page itself, so the scrollbar is the world — there is
				   nothing left to fold in, and the return is exact by construction. */
				sessionStorage.setItem(RETURN_Y_KEY, String(Math.round(window.scrollY)));
			} catch {
				/* ignore */
			}
		}
	}

	/* ---- hover (pointer devices only) ---------------------------------------------------------- */

	function onPointerOver(e) {
		const el = e.target.closest('[data-tv-work]');
		if (el) {
			hovered = el;
			wake(); // the hover lift is an eased value; it needs frames to ease over
		}
	}
	function onPointerOut(e) {
		/* Only clear when the pointer actually leaves the hovered work — pointerout also fires when moving
		   between the work's own descendants, and relatedTarget still inside it means we have not left. */
		const to = e.relatedTarget;
		if (hovered && (!to || !hovered.contains(to))) {
			if (e.target.closest('[data-tv-work]') === hovered) {
				hovered = null;
				wake(); // …and to ease back out again
			}
		}
	}

	/* ---- lifecycle ----------------------------------------------------------------------------- */

	/* PERF-007. A background tab has nothing to draw and must not travel. Resuming resets the auto-scroll's
	   delay to the moment of return, so a visitor never comes back to a page that has walked on without
	   them and is still walking. */
	function onVisibility() {
		if (document.hidden) {
			sleep();
			if (autoArm) {
				clearTimeout(autoArm);
				autoArm = 0;
			}
			autoRun = false;
			autoLife = 0;
		} else {
			lastInput = performance.now();
			lastT = 0;
			wake();
		}
	}

	/* A HARD UNLOAD IS NOT A TEARDOWN TO THE DOCUMENT. `stop()` normally hands the page back to the
	   accessible column, which includes restoring every stashed `srcset` — and doing that while the browser
	   is navigating away would queue ~30 image fetches nobody will ever see. So the unload path keeps the
	   deferral and only releases the machinery. */
	function onPageHide() {
		stop({ keepDeferred: true });
	}

	let resizeRaf = 0;
	function onResize() {
		cancelAnimationFrame(resizeRaf);
		resizeRaf = requestAnimationFrame(() => {
			measure();
			readScroll();
			render();
			wake();
		});
	}

	function start() {
		mountedAt = performance.now();
		root.dataset.tvActive = 'true';
		canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
		measure();
		/* RETURN TO THE WORK YOU LEFT (D-72, made exact in Phase 3 / D-73). The "Terug naar portfolio" link on
		   every project page returns the visitor to precisely where they were on the coil (Experience
		   Architecture §11/§7.1).

		   WHY BY EXACT SCROLL, NOT BY WORK INDEX. The coil is a pure function of window.scrollY, so the one
		   value that reproduces a position perfectly is the scrollY itself. Mapping a work id → scrollY needs
		   the scroll↔journey mapping, which is not yet stable while the page is loading (fonts, images, the
		   footer below this root all reflow), so it landed a work or two off; and the browser's own
		   scroll-to-fragment fights it. So the coil STORES its exact scrollY when the visitor opens a project
		   (see the project-link handler below) and RESTORES that exact number here — immune to both problems.
		   The `#work-<id>` fragment is kept only as the no-JS return (an in-flow column scrolls to it natively)
		   and as the JS return SIGNAL; in JS it is stripped so the native fragment scroll cannot interfere. */
		const hash = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';
		const hashWork = hash ? works.find((x) => x.el.id === hash) : null;
		/* A back/forward traversal that does NOT come through bfcache re-runs this with no fragment (browser
		   back from a project). Consume the stored return scroll there too, so the exact frame is restored even
		   when bfcache is unavailable. (With bfcache, this function does not re-run and the coil's own state is
		   already preserved.) */
		const navType = performance.getEntriesByType('navigation')[0]?.type;
		let returnY = null;
		if (hash || navType === 'back_forward') {
			try {
				const v = sessionStorage.getItem(RETURN_Y_KEY);
				if (v !== null) {
					returnY = parseInt(v, 10);
					sessionStorage.removeItem(RETURN_Y_KEY);
				}
			} catch {
				/* ignore */
			}
		}
		if (hash) {
			try {
				history.replaceState(history.state, '', location.pathname + location.search);
			} catch {
				/* ignore */
			}
		}
		const place = () => {
			/* Re-measure first: the reading work the visitor left at is only reproduced exactly when the
			   scroll↔journey mapping is the SETTLED one (root height, offsets), and at first paint it is not.
			   Re-measuring here means the authoritative post-load placement maps the restored scroll to the
			   identical work, not one a step away. */
			measure();
			if (returnY !== null && Number.isFinite(returnY)) {
				/* The exact scroll the visitor left at. A fixed number, so repeated placements agree and it
				   overrides any native fragment scroll; the journey it maps to converges to the right work as
				   the layout settles. */
				window.scrollTo({ top: returnY, behavior: 'instant' });
			} else if (hashWork) {
				/* Fallback for a direct/shared /portfolio/#work-<id> link with no stored scroll: map the work to
				   a scroll position. Best-effort — exact once the layout has settled (the re-placement below). */
				const { top, usable } = scrollRange();
				const worksUsable = Math.max(usable - outroPx, 1);
				window.scrollTo({ top: Math.round(top + (hashWork.i / span) * worksUsable), behavior: 'instant' });
			} else {
				return;
			}
			readScroll();
			journey = target;
			releaseAuto();
			render();
		};
		place();
		readScroll();
		journey = target;
		lastT = 0;
		lastInput = performance.now(); // the auto-scroll's clock starts at the arrival, not at zero
		autoLife = 0;
		autoRun = false;
		outro = 0;
		outroTarget = 0;
		render();
		running = true;
		/* ONE AUTHORITATIVE RE-PLACEMENT ONCE THE LAYOUT IS SETTLED, so an exact-scroll return re-asserts over
		   the browser's fragment scroll and a work-mapping fallback lands on the settled mapping. */
		if (hash || returnY !== null) {
			if (document.readyState === 'complete') setTimeout(place, 200);
			else window.addEventListener('load', () => setTimeout(place, 60), { once: true });
		}
		wake();
		/* The look-ahead opens from `loadAheadFirst` to `loadAhead` at `loadRampMs` (D-80), and it is applied
		   inside place(), which only runs on a frame. A visitor who lands and does not move would therefore
		   never get the widened window — so one frame is requested at exactly that moment. It costs a single
		   tick and then the loop goes back to sleep. */
		setTimeout(wake, cfg.loadRampMs + 40);
		/* The cached scroll range is measured in measure(), which runs before the footer's own imagery and the
		   fonts have settled. One refresh at load costs a single layout and keeps the cache honest without ever
		   putting a layout read back on the scroll path (P10 / D-81). */
		if (document.readyState !== 'complete')
			window.addEventListener('load', () => { refreshRange(); readScroll(); wake(); }, { once: true });
		window.addEventListener('scroll', readScroll, { passive: true });
		/* THE VISITOR'S OWN INPUT, AHEAD OF THE SCROLL EVENT (P21). These fire before the page has moved, so
		   the auto-scroll is already released by the time the first pixel of a gesture lands — there is never
		   a frame in which the engine and a hand are both moving the page. `touchstart` rather than
		   `touchmove`: a finger DOWN on the glass is already "de pagina vasthouden". */
		autoInputEvents.forEach((t) => window.addEventListener(t, releaseAuto, { passive: true }));
		window.addEventListener('resize', onResize, { passive: true });
		root.addEventListener('keydown', onKey);
		root.addEventListener('focusin', onFocusIn);
		root.addEventListener('focusout', onFocusOut);
		root.addEventListener('click', onProjectLink, true);
		if (canHover && stage) {
			stage.addEventListener('pointerover', onPointerOver);
			stage.addEventListener('pointerout', onPointerOut);
		}
		/* ---- PERF-007 lifecycle ----------------------------------------------------------------
		   A HIDDEN TAB DRAWS NOTHING. Browsers already throttle rAF in a background tab, but they do not
		   stop the auto-scroll's timer, and coming back to a page that has travelled while you were reading
		   your email is exactly the "het beweegt uit zichzelf" this work is removing. So: sleep on hide,
		   and on show resume from THIS moment — `lastInput` is reset so the auto-scroll's delay starts
		   again from the visitor's return rather than from whenever they left. */
		document.addEventListener('visibilitychange', onVisibility);
		/* THE NEAR PLANE. tick() sleeps while the lightbox owns the screen; this is what wakes it when the
		   lightbox closes. An attribute observer on <body>'s class fires only when a class actually changes,
		   which on this page is a handful of times in a session — far cheaper than the frame-rate polling it
		   replaces, and it needs no handshake with the lightbox module. */
		npObserver = new MutationObserver(wake);
		npObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
		/* Backstop: nothing may outlive the page (the brief's cleanup requirement). bfcache restores the
		   runtime's own state, so this is only the hard-unload path. */
		window.addEventListener('pagehide', onPageHide);

		/* THE STOP (WCAG 2.2.2). The page provides the control; the engine owns the state, so there is no
		   cross-module handshake and nothing to wire when the runtime is not mounted (under reduced motion
		   and without JavaScript the chrome this lives in is `display: none` and the auto-scroll does not
		   exist). The choice persists for the session, so it survives opening a project and coming back. */
		autoBtn = root.querySelector('[data-pf-auto]');
		if (autoBtn) {
			try {
				/* PERF-001: an explicit opt-IN. Absent means off, so a fresh session never travels by itself. */
				autoPaused = sessionStorage.getItem(AUTO_ON_KEY) !== '1';
			} catch {
				/* ignore */
			}
			syncAutoBtn();
			autoBtn.addEventListener('click', () => {
				autoPaused = !autoPaused;
				if (autoPaused) releaseAuto();
				else {
					/* Pressing START is an explicit request, so the journey begins from this moment's own
					   `autoDelay` — the visitor gets the full pause to look at the photograph they were
					   reading before the page carries on. `wake()` is needed because with the auto-scroll off
					   the loop is allowed to be asleep (PERF-007); without it, pressing start would do
					   nothing until the next gesture. */
					lastInput = performance.now();
					wake();
				}
				try {
					if (autoPaused) sessionStorage.removeItem(AUTO_ON_KEY);
					else sessionStorage.setItem(AUTO_ON_KEY, '1');
				} catch {
					/* ignore */
				}
				syncAutoBtn();
			});
		}
	}

	/* The control carries its state in `aria-pressed` for assistive technology and in a class for the eye —
	   two independent signals, never colour alone (A11Y-09). The label says what PRESSING it will do. */
	function syncAutoBtn() {
		if (!autoBtn) return;
		autoBtn.setAttribute('aria-pressed', autoPaused ? 'false' : 'true');
		autoBtn.classList.toggle('is-off', autoPaused);
		autoBtn.setAttribute(
			'aria-label',
			autoPaused ? 'Automatisch scrollen starten' : 'Automatisch scrollen pauzeren'
		);
	}

	function stop(opts) {
		running = false;
		sleep();
		if (autoArm) {
			clearTimeout(autoArm);
			autoArm = 0;
		}
		cancelAnimationFrame(resizeRaf);
		if (npObserver) {
			npObserver.disconnect();
			npObserver = null;
		}
		document.removeEventListener('visibilitychange', onVisibility);
		window.removeEventListener('pagehide', onPageHide);
		delete root.dataset.tvActive;
		/* The document goes back to being the single accessible column, where every photograph is simply
		   present — so nothing may stay stashed behind the coil's load window (P9 / D-80). Skipped on a hard
		   unload, where there is no document left to hand back to (see onPageHide). */
		if (!opts || !opts.keepDeferred) releaseAllDeferred();
		if (viewportEl) viewportEl.style.visibility = '';
		if (stage) {
			stage.style.opacity = '';
			stage.style.transform = '';
		}
		window.removeEventListener('scroll', readScroll);
		autoInputEvents.forEach((t) => window.removeEventListener(t, releaseAuto));
		autoRun = false;
		autoLife = 0;
		window.removeEventListener('resize', onResize);
		root.removeEventListener('keydown', onKey);
		root.removeEventListener('focusin', onFocusIn);
		root.removeEventListener('focusout', onFocusOut);
		root.removeEventListener('click', onProjectLink, true);
		if (stage) {
			stage.removeEventListener('pointerover', onPointerOver);
			stage.removeEventListener('pointerout', onPointerOut);
		}
		hovered = null;
		focused = null;
		const clear = (w) => {
			w.el.style.transform = '';
			w.el.style.opacity = '';
			w.el.style.zIndex = '';
			w.el.style.visibility = '';
			w.el.style.width = '';
			w.el.style.height = '';
			w.el.style.removeProperty('--tv-cap-o');
			w.el.style.removeProperty('--tv-gold');
			w.el.style.removeProperty('will-change');
			w.tone.style.filter = ''; // the colour matrix — the whole grade since P15
			w.hoverF = 0;
			w.lastTone = null;
			w.lastOpacity = null;
			w.lastZ = null;
			w.lastCap = null;
			w.lastGold = null;
		};
		for (const w of works) {
			clear(w);
			w.el.removeAttribute('aria-hidden'); // real works return to the accessible document
		}
		for (const L of leads) clear(L); // leads keep their template aria-hidden — they are decorative
	}

	/* ---- the geometry report --------------------------------------------------------------------- */

	/* PROOF, NOT ASSERTION — and this time proof of the RIGHT claim.
	   D-66's report asked "are these points on a helix?" and answered yes, correctly, about a world that
	   did not look like the reference at all. A true number can answer the wrong question. This report
	   therefore checks the four things that actually distinguish a spring seen from outside from a tunnel
	   flown through, and it checks them by reading back the transform each element was ACTUALLY given —
	   never by re-evaluating the placement formula, which could only ever agree with itself.

	     1. the axis is VERTICAL   — every live work is the same distance from the world's Y axis
	     2. the camera is OUTSIDE  — D > R, reported as the ratio; > 1 means outside, ≫ 1 means far
	     3. works are TANGENT      — each work's rotateY equals the polar angle of its own position
	     4. the ribbon is CONTINUOUS — constant angular step, constant rise per work
	*/
	function helix() {
		const pts = [];
		for (const w of works) {
			/* Only works that are ALIVE this frame. A culled element keeps the last transform it was given,
			   and reading those back mixes positions from different journey positions into one point set —
			   which is not a defect in the world, only in the measurement. */
			if (!w.visible) continue;
			const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px, ([-\d.]+)px\) rotateY\((-?[\d.]+)deg\)/.exec(
				w.el.style.transform,
			);
			if (!m) continue;
			const x = parseFloat(m[1]);
			const y = parseFloat(m[2]);
			const z = parseFloat(m[3]);
			const face = (parseFloat(m[4]) * Math.PI) / 180;
			/* Skip works the entrance/exit recession (edgeSink, D-72) has pushed off the pure cylinder near the
			   frame edges — their z is deliberately no longer R·cosθ, so including them would make this proof
			   (which checks the CYLINDER) fail on an intended effect. |y| is unaffected by edgeSink, so it is
			   the honest gate: below edgeStart no recession has been applied. The reading guarantee — works
			   square-on and unclipped at their moment — is proved separately by the reading probe. */
			if (Math.abs(y) > cfg.edgeStart * liveY) continue;
			pts.push({
				i: w.i,
				x,
				y,
				z,
				w: w.w,
				delta: w.delta,
				/* Distance from the VERTICAL axis. In D-66 this was hypot(x, y) — distance from the axis
				   that pointed into the screen. The single character that changed here is the whole
				   difference between the two worlds. */
				r: Math.hypot(x, z),
				/* The RIBBON angle, not the wrapped polar angle: works span more than one revolution, and
				   atan2 would fold turn 2 back on to turn 1 and make the y = −k·θ test meaningless. This
				   is read back from the rendered rotateY, which is the unwrapped value the runtime wrote. */
				theta: face,
				polar: Math.atan2(x, z),
				face,
			});
		}
		const stat = (a) => {
			const mean = a.reduce((s, v) => s + v, 0) / a.length;
			const sd = Math.sqrt(a.reduce((s, v) => s + (v - mean) ** 2, 0) / a.length);
			return { mean, sd, min: Math.min(...a), max: Math.max(...a), spread: Math.max(...a) - Math.min(...a) };
		};
		const wrapPi = (v) => Math.atan2(Math.sin(v), Math.cos(v));
		const Rs = stat(pts.map((p) => p.r));

		/* 4. CONTINUITY. The angular step is deliberately NOT constant any more (a wide work occupies more
		   arc than a narrow one), so a constant-step test would now report a false failure. What must hold
		   instead is the helix relation itself — y = −k·θ, the same k for every work — plus the tiling
		   claim: consecutive chords meet end to end, leaving neither a hole nor a crossing. */
		/* k BY LEAST SQUARES, NOT PER-POINT DIVISION. −y/θ is the right identity but the wrong estimator:
		   rotateY is written to the DOM at 0.01° precision, and dividing by a θ near zero turns that
		   quantisation into a large apparent spread (measured: 1.13px of "error" that was entirely the
		   work sitting at its own reading moment). Fitting the slope over every live work and reporting
		   the worst RESIDUAL keeps the tolerance where it belongs — a position error, in pixels. */
		let sTT = 0;
		let sTY = 0;
		for (const p of pts) {
			sTT += p.theta * p.theta;
			sTY += p.theta * -p.y;
		}
		const kFit = sTT > 1e-9 ? sTY / sTT : 0;
		let kResid = 0;
		for (const p of pts) kResid = Math.max(kResid, Math.abs(-p.y - kFit * p.theta));
		const K = { mean: kFit, worstResidualPx: +kResid.toFixed(3) };
		/* GAP AND OVERLAP AT EACH SEAM. Each work owns the arc its own chord subtends, so the test is
		   angular and then converted to pixels: the arc between two centres, minus each work's own half
		   slot. Zero means the chords meet end to end. (The first version of this metric subtracted half
		   CHORDS from an ARC — two different measures of the same span — and reported a 24.7px gap in a
		   ribbon that was in fact exactly closed.) */
		const seams = [];
		for (let i = 1; i < pts.length; i++) {
			if (pts[i].i !== pts[i - 1].i + 1) continue;
			const a = pts[i - 1];
			const b = pts[i];
			seams.push((Math.abs(b.theta - a.theta) - (a.delta + b.delta) / 2) * Rs.mean);
		}
		const S = seams.length ? stat(seams) : { mean: 0, max: 0, min: 0, sd: 0, spread: 0 };

		/* 3. TANGENCY. A work's facing must equal the polar angle of its own position, or it is not lying
		   on the cylinder — it is a billboard hung near one. Reported as an ARC error so the tolerance
		   does not silently tighten as the radius shrinks on a phone. */
		const faceErr = stat(pts.map((p) => Math.abs(wrapPi(p.face - p.polar)) * p.r));

		return {
			samples: pts.length,
			/* 1. the axis is vertical */
			radiusPx: Rs,
			axisIsVertical: Rs.spread < 0.5,
			/* 2. the camera is outside */
			cameraDistancePx: +D.toFixed(1),
			cameraDistanceInRadii: +(D / R).toFixed(2),
			cameraIsOutside: D > R,
			/* how much larger the nearest point of the coil is than the farthest. The reference measures
			   1.25 — a work at the front is 25% bigger than the same work at the back. A tunnel measures
			   this in MULTIPLES, not percentages, which is exactly why a tunnel feels like a tunnel. */
			nearFarScaleRatio: +((D + R) / (D - R)).toFixed(3),
			/* 3. works lie on the cylinder */
			facingArcErrorPx: +faceErr.max.toFixed(3),
			worksAreTangent: faceErr.max < 0.5,
			/* 4. the ribbon is one continuous helix, tiled without holes */
			risePerRadianPx: K,
			isOneHelix: kResid < 0.5,
			seamPx: { mean: +S.mean.toFixed(1), worstGap: +S.max.toFixed(1), worstOverlap: +S.min.toFixed(1) },
			ribbonIsContinuous: S.max < Rs.mean * 0.06 && S.min > -Rs.mean * 0.06,
			/* the reference's dimensionless signature, for direct comparison */
			ratios: {
				cameraDistance: +(D / R).toFixed(2), // reference 9.0
				pitch: +(((Math.abs(K.mean) * Math.PI * 2) / R) || 0).toFixed(3), // reference 1.1
				worksPerTurn: +((Math.PI * 2 * pts.length) /
					Math.max(Math.abs(pts[pts.length - 1].theta - pts[0].theta), 1e-6)).toFixed(1),
			},
			readingScale: +readScale.toFixed(4),
			radiusChosenPx: +R.toFixed(1),
			verdict:
				Rs.spread < 0.5 &&
				D > R &&
				faceErr.max < 0.5 &&
				kResid < 0.5 &&
				S.max < Rs.mean * 0.06 &&
				S.min > -Rs.mean * 0.06,
		};
	}

	/* THE TUNING SEAM. Re-shape the world from new tunables without a reload, so two candidate coils can be
	   compared on the SAME frame of the SAME journey instead of from memory of two page loads.
	   P10 (D-81): this was marked "prototype-only, removed when the route is promoted"; the route was
	   promoted in D-72 and the function stayed, so the comment was a stale claim. It earns its place and is
	   kept deliberately — it is how the P10 investigation isolated the depth-of-field from the light grade on
	   one frame (`retune({ farBlur: 0 })` vs the grade zeroed), which is what identified the render-surface
	   cost. Roughly 300 bytes, and it touches nothing unless something calls it. */
	function retune(partial) {
		Object.assign(cfg, partial);
		span = Math.max(works.length - 1, 1);
		measure();
		readScroll();
		journey = target;
		render();
		wake();
		return cfg;
	}

	/* The camera is a constant in this world, so it is reported rather than computed per frame. */
	function camera() {
		return { x: 0, y: 0, z: D, lookingAt: 'the vertical axis', distanceInRadii: D / R };
	}

	return {
		start,
		stop,
		focusWork,
		helix,
		camera,
		retune,
		get journey() {
			return journey;
		},
		works,
		cfg,
	};
}

/* Progressive enhancement gate. Without JavaScript, or with reduced motion requested, the document that
   the server rendered is the whole experience — a complete, accessible, elegant portfolio. The traverse is
   never the only way to reach a photograph. */
export function mountTraverse(root, opts = {}) {
	const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
	let instance = null;
	const api = { get instance() { return instance; } };

	const sync = () => {
		if (mq.matches) {
			if (instance) {
				instance.stop();
				instance = null;
			}
			return;
		}
		if (!instance) {
			/* Forward opts (e.g. the Phase-3 `onFrame` chrome hook) to the runtime. `expose` rides along into
			   cfg harmlessly; only `onFrame` is read there. Under reduced motion this branch never runs, so a
			   chrome hook simply never fires and the chrome falls back to its static state. */
			instance = createTraverse(root, opts);
			if (instance) instance.start();
		}
	};

	sync();
	mq.addEventListener('change', sync);
	api.stop = () => instance && instance.stop();
	return opts.expose ? api : api.stop;
}
