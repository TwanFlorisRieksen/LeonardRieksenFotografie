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
	farDim: 0.34, // opacity at the very back of the coil; 1 at the front. Low enough that the back reads as
	// shadow, high enough that it reads as PRESENT — the owner's correction was that the back is missing, so
	// it must be visibly there, not merely less-black. The blur below is what keeps it from competing. Raised
	// back to 0.34 (D-72, "iets minder darkening"): the D-71 push to 0.28 leaned on darkness to separate the
	// planes, but the owner wants the photography to carry more light, not less — the near/far contrast now
	// comes mostly from the depth-of-field and the light hierarchy, so the mid-coil can stay livelier.
	depthGamma: 1.8, // >1 keeps the near face bright longer and darkens the turn into the back faster. Eased
	// 2.0→1.8 (D-72) so the front strand of the coil stays brighter and the darkening is gentler — the owner
	// asked the hero to be highlighted with LIGHT rather than the surround being pushed into shadow.
	farBlur: 7, // px of defocus at the very back of the coil, 0 across the whole FRONT hemisphere. THE
	// DEPTH-OF-FIELD, and the answer to "don't just mirror the photographs": a plane turned past 90° shows its
	// image reversed, but by then it is on the BACK of the coil and softened out of legibility, so the far side
	// reads as the out-of-focus back of the ribbon — real distance, a solid object — never as a second copy.
	// Applied only where z < 0 (the far hemisphere), shaped by backGamma, so a front-facing OR side work is
	// razor sharp and only the genuine back softens (D-72 rev.2, owner: "de foto's aan de voorkant niet
	// geblurt"). Quantised in place() so a stationary card caches one raster instead of re-rasterising.
	backGamma: 1.9, // >1 keeps the near-back gentle and deepens the blur toward the very back. `blur =
	// max(0, -z/R)^backGamma · farBlur` — 0 across the entire front hemisphere (z ≥ 0), ramping in only once a
	// work has turned past the side onto the back. This is what makes "front sharp, back soft" literal. Raised
	// 1.5→1.9 (D-72 rev.2, owner: "er is te veel blur") so the softness concentrates on the DEEPEST works: the
	// near/mid-back reads mostly sharp (more photography legible), while the fully-turned ~180° works still get
	// 6–7px — enough to keep their MIRRORED back-faces from ever reading as a backwards photograph (the D-68
	// constraint; measured: works past 150° facing stay ≥6px).

	/* --- feel --------------------------------------------------------------------------------------- */
	scrollPerWork: 720, // document pixels of scroll per work. Raised from 640 (D-70) so each work lingers
	// longer at its reading moment — the owner asked for "meer rust, meer luxe", and a slower cadence per
	// work is the temporal half of that (the pitch is the spatial half). Geometry is untouched; this only
	// scales scroll↔journey, so the reading moment still lands exactly on an integer journey.
	damp: 0.15, // spring coefficient toward the scroll-derived target, expressed PER 60Hz FRAME and normalised
	// to real time in tick() (see there). Kept crisp so the reading moment SETTLES square-on quickly — the
	// "world stops dead when scroll stops" that the owner flagged is answered by the ambient life layer below,
	// not by a mushy spring that would soften the read.
	// P10 (D-81): 0.082 → 0.15. At 0.082 the world covered only 8% of a new scroll target in the first frame
	// and needed ~600ms to arrive — a time constant of 203ms sitting between every input and its answer, which
	// is precisely the "pas iets later scrolt het daadwerkelijk" the owner reported. 0.15 gives a 103ms time
	// constant: the coil still has visible weight and still glides into its reading angle, but it starts moving
	// WITH the wheel instead of behind it. The adaptive term below is unchanged.
	margin: 0.055, // safe-box inset as a fraction of the smaller viewport axis
	edge: 1.15, // cull once a work is this many half-viewport-heights from centre

	/* --- life ---------------------------------------------------------------------------------------- */
	/* THE WORLD IS NEVER QUITE STILL. The owner's note: the build "stopt vrijwel direct zodra scroll stopt;
	   de wereld leeft niet". When the visitor stops scrolling, an ambient drift eases in and the coil floats
	   — a slow parallax of the CAMERA (perspective-origin), not of any photograph. Because it moves only the
	   vanishing point, every card stays exactly as square-on and unclipped as it was: a plane parallel to the
	   screen only translates a few pixels under a perspective-origin shift, it does not rotate, skew or crop.
	   So the reading guarantee is untouched and the scrollbar never lies (journey is not moved), yet the
	   world breathes. This is the first tenant of a `life` layer designed to also hold inertia, auto-drift
	   and hover later — see the seams marked `LIFE HOOK` in tick() and place(). Reduced motion never mounts
	   the runtime at all, so all of this is automatically off there. */
	idleDelay: 520, // ms of no scroll input before the ambient drift eases in
	idleRamp: 1400, // ms for the drift to reach full amplitude once idle (and to fall back on input)
	swayAmp: 3.4, // camera parallax amplitude, in % of the viewport (perspective-origin offset)
	swayPeriodX: 15, // seconds — the two axes use different periods so the float never repeats a straight line
	swayPeriodY: 21,

	/* --- the coil keeps turning (D-72, owner: "wanneer de gebruiker stopt met scrollen, de wereld moet
	   vanzelf heel langzaam verder naar beneden bewegen … alsof de coil continu rustig verder draait") -------
	   When the visitor is idle, the JOURNEY itself creeps forward — the coil descends of its own accord, very
	   slowly, so the world keeps living instead of freezing. This is NOT scroll hijacking: window.scrollY and
	   the scrollbar are NEVER touched. The drift lives in `autoOffset`, an addend to the spring target; it eases
	   in with the same `life` envelope as the camera sway, is bounded so the world and the scrollbar never
	   diverge by more than a couple of works, and UNWINDS the moment the visitor scrolls again so the scrollbar
	   stays honest whenever they are in control. Reduced motion never mounts the runtime, so this is off there. */
	autoSpeed: 0.08, // works per second the coil drifts forward at full idle (≈ 2.8°/s of coil rotation — a
	// slow cinematic turn, gently perceptible but "heel langzaam, rustgevend"). Scaled by `life`, so it eases
	// in and out rather than switching on. Bounded by autoMax so it is never "continuously distracting" motion.
	autoMax: 0.9, // works the coil may turn on its own before it rests — the D-72 budget, and now a budget
	// per REST rather than a ceiling on a debt (see `driftSpent`): the coil keeps turning for about eleven
	// seconds after you stop, then holds. A calm settle, never an auto-tour that carries the visitor away.
	// It no longer decides anything about responsiveness. Under D-81 it doubled as the size of the debt the
	// visitor had to scroll off, which is why it was cut to 0.9 there; with the debt gone (P12 / D-84) this
	// number means only what its name says.
	/* ============================================================================================
	   P12 (D-84): THE DRIFT IS NO LONGER A DEBT THE VISITOR PAYS. IT IS RE-BASED WHILE THEY REST.

	   D-81 replaced a time-based unwind (which could move the world BACKWARD against a scroll) with a
	   share of the visitor's own travel: `autoOffset -= travel * 0.45`. That removed the reversal, and it
	   left something quieter and, on the evidence, worse — because it is present on EVERY gesture rather
	   than only after a long idle.

	   MEASURED on the built page at 1440×900, one 300 px wheel notch (worth 0.4186 works at this cadence),
	   from a merely WARM state (not a long idle):

	       journey moved  0.2107 works   =  50.3% of the input
	       first frame    0.1218         =  the response is immediate, and it is immediately half-scale

	   The camera was not late. It was UNDER-POWERED: the world travelled roughly half as far as the
	   scrollbar for as long as any drift debt existed — and debt accrues every time the reader pauses for
	   half a second, which is what reading a portfolio IS. That is exactly "stroef", "niet fris", "alsof
	   het achter je aan komt": a direct, instant, correctly-damped response at the wrong GAIN.

	   The fix is to stop treating the drift as something to undo. While the visitor is scrolling,
	   `autoOffset` is FROZEN: the world moves 1:1 with the scrollbar, from the first frame, at full gain,
	   with nothing subtracted. ~300 ms after they stop — the coil settled, nothing moving — the offset is
	   RE-BASED: the same distance is added to `window.scrollY` and removed from `autoOffset` in one step.
	   Because the journey is `target + autoOffset` and both change by the same amount, the rendered world
	   does not move by so much as a pixel; only the scrollbar thumb catches up with the world it was
	   describing (≤ 0.9 works ≈ 1.6% of this page's thumb travel). Nothing is hijacked: the correction
	   happens at rest, never during a gesture, and it makes the scrollbar MORE honest, not less.
	   ============================================================================================ */
	rebaseDelay: 300, // ms of no scroll input, with the coil settled, before the drift is re-based

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

	/* --- neighbour hierarchy: LIGHT, not blur (D-72, owner: "highlight de hero met licht, niet met blur;
	   de foto's aan de voorkant grotendeels scherp; veel minder blur dan nu") -----------------------------
	   D-71 kept exactly ONE card crisp and blurred every front neighbour up to 7px, so the whole front strand
	   read as a soft smear around one sharp hero — the owner judged this "doorgeschoten": the photography was
	   suffering under the effect (blueprint priority 1). The hierarchy is now carried by LIGHT: a front work
	   loses a little brightness as it turns away from square-on (`neighborDim`), so the hero is the brightest
	   plane on the coil while its neighbours stay SHARP and fully readable. Both terms are multiplied by
	   `depth` so they only touch the FRONT strand — the back is handled by farBlur + the opacity grade, and
	   double-treating it would flatten the coil. A whisper of angle blur remains for the most strongly turned
	   front planes only, purely as a hint of their oblique angle — blur is otherwise DEPTH indication only.
	   The reading card (θ=0) is always exactly 0 blur / full brightness, so its guarantee is untouched. */
	sharpFalloff: 0.72, // radians of |θ| over which a front neighbour turns from square-on (0) to full (~41°)
	neighborBlur: 0, // px of angle blur on the FRONT strand. ZERO (2→0, D-72 rev.2, owner: "de foto's aan de
	// voorkant niet geblurt"). The entire front hemisphere is the focal plane — sharp, always. The hero is
	// distinguished purely by LIGHT (neighborDim below), by being square-on and centred, and by being the
	// largest plane. Blur exists ONLY on the back hemisphere now (backGamma), as honest depth of field.
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
	edgeBlurMax: 0, // px of defocus a work reaches as it leaves the frame. ZERO (3→0, D-72 rev.2): a departing
	// work is not blurred at all — it fades (opacity) and recedes (edgeSink) so it is "already out" by the time
	// it would otherwise be soft, rather than lingering as a blurry ghost at the frame edge.
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
	loadAheadFirst: 1.4,
	loadRampMs: 1600, // ms after mount at which the look-ahead opens to `loadAhead`

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

const clampUnit = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* sessionStorage key holding the exact coil scrollY the visitor left at when they opened a project, so the
   return from that project lands on the identical frame (Phase 3 / D-73). */
const RETURN_Y_KEY = 'tv-return-y';

export function createTraverse(root, opts = {}) {
	const cfg = { ...CFG, ...opts };
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
		 * WHERE THE LIGHT GRADE IS APPLIED, AND WHY IT IS NOT THIS ELEMENT (P10 / D-81).
		 *
		 * This is the single change that took `/portfolio/` from 30fps to 60fps on a Retina display, and it
		 * is not about the effect being expensive — it is about WHICH BOX carries it.
		 *
		 * A CSS `filter` on an element forces Chrome to allocate a render surface for it. When that same
		 * element also carries a transform that changes every frame, the surface has to be re-rasterised in
		 * SCREEN SPACE on every one of those frames, at device resolution. MEASURED on the built page in
		 * headful Chrome at 1440×900, dpr 2, scrolling the coil continuously:
		 *
		 *     engine's own dynamic filter on .tv-work   median 33.4ms   p95 51ms    (~30fps)
		 *     a STATIC blur(7px) on .tv-work            median 32.3ms   p95 50ms    (~30fps)
		 *     the same STATIC blur(7px) on .tv-work img median 16.7ms   p95 17.7ms  (60fps)
		 *     no filter at all                          median 16.7ms   p95 17.7ms  (60fps)
		 *
		 * The static case is the proof: the blur cost the same when it never changed, so the expense was never
		 * the blur being recomputed — it was the filtered surface being redrawn because the element under it
		 * had moved. Isolating the two halves of the grade agreed: with `farBlur: 0` and the whole
		 * brightness/contrast/saturate grade left running, the page measured 16.7ms; with the grade off and
		 * the blur left on, 32.5ms. The colour matrix is free; the render surface is not.
		 *
		 * So the grade moves one level in, onto the `.media` box — which is exactly the photograph, carries no
		 * transform of its own, and is rasterised ONCE in local space and then simply transformed with its
		 * parent. Nothing about the art direction changes: the same blur, the same depth-of-field, the same
		 * reading-moment light, on the same pixels. The caption and the gold mount line are now outside the
		 * graded box, which is if anything more correct — a caption should not be defocused with the plate it
		 * labels — and the difference where they overlap is under 7% of brightness, measured.
		 */
		grade: el.querySelector('.media') || el.querySelector('picture') || el.querySelector('img') || el,
		/*
		 * THE TWO GRADINGS COST DIFFERENT AMOUNTS, SO THEY GET DIFFERENT BOXES (P10 / D-81, second pass).
		 *
		 * Moving the whole filter off the transformed element fixed the median (33.4ms → 16.7ms) but left a
		 * tail: 5–19 frames per 2.6s run still ran 30–50ms. MEASURED, correlating every frame against image
		 * arrivals and against filter churn: ZERO images arrived during the run, and the long frames carried
		 * **3.75 filter-string changes** against **1.32** on the healthy ones. The spikes were the blur being
		 * regenerated.
		 *
		 * The cause is that both gradings shared one `filter` property. `blurPx` is deliberately rounded to
		 * whole pixels so a travelling work re-blurs only a handful of times — but `brightness` beside it is a
		 * continuous value that moves every single frame, so the STRING changed every frame, and Chrome
		 * re-ran the entire chain, blur included. The quantisation was real and it was being defeated by its
		 * own neighbour.
		 *
		 * So the depth-of-field stays on `.media` (regenerated only when the rounded pixel radius actually
		 * changes) and the colour matrix moves one level in, onto the <img> — where it is a cheap per-pixel
		 * operation that can change every frame for nothing. Measured on its own earlier in this session: the
		 * colour grade with the blur disabled ran a flat 16.7ms.
		 *
		 * The two now compose inner-to-outer (colour, then blur) where they used to compose left-to-right
		 * (blur, then colour). A Gaussian blur is linear and brightness/saturate are per-pixel linear, so the
		 * two orders differ only in contrast's constant term — below the quantisation step, and verified on
		 * the render.
		 */
		tone: el.querySelector('img') || el.querySelector('picture') || el.querySelector('.media') || el,
		/* Last values written, so an unchanged frame writes nothing at all. Every one of these is a style
		   invalidation on a subtree, and a custom property is an invalidation on the subtree that reads it —
		   with the coil nearly still (the idle drift moves it a few thousandths of a work per frame) most of
		   them do not change from frame to frame, and re-writing them was pure invalidation for no pixels. */
		lastFilter: null,
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

	/* ---- the life layer ---- */
	let viewportEl = null; // the perspective host; the ambient drift moves its perspective-origin
	let lastInput = 0; // timestamp of the last scroll/keyboard input, for the idle ramp
	let life = 0; // 0..1 ambient-drift amplitude, eased toward 1 when idle and 0 on input
	let clock = 0; // seconds of run time, drives the sway oscillators (rAF-timed, not frame-counted)
	let lastT = 0;
	let autoOffset = 0; // works the idle auto-drift has added to the spring target (D-72); frozen while the
	// visitor scrolls and re-based onto scrollY once they rest (P12 / D-84 — see rebaseDrift)
	let lastOrigin = ''; // last perspective-origin written, so the ambient drift writes only on change
	/* ONE re-base per gesture (P12 / D-84). Armed by a real visitor scroll, disarmed the moment the offset
	   has been settled onto scrollY. Without the arming the re-base would run on every frame of the idle
	   period, converting the drift into scrollbar movement as fast as it accrued — an auto-tour that never
	   rests and that moves the visitor's own scroll position, which is precisely what D-72 forbids. */
	let rebaseArmed = false;
	/* The scroll position the re-base itself moved to. `window.scrollTo` fires its scroll event
	   ASYNCHRONOUSLY, after `rebaseDrift` has already returned, so restoring `lastInput` and disarming
	   inside that function is not enough — the late event re-armed the re-base and reset the idle timer on
	   every frame, which silently disabled the ambient drift altogether (measured: 12 px of drift in 14 s
	   where 0.9 works ≈ 660 px was intended). Any scroll event that reports exactly this position is ours;
	   the first one that does not clears it. */
	let programmaticY = null;
	/* Total drift accrued since the visitor last scrolled. `autoOffset` alone can no longer bound the
	   drift, because the re-base zeroes it while the visitor is still resting — without this the coil would
	   simply start a second 0.9-work drift after every settle-up. This is the D-72 budget itself: the coil
	   turns for about eleven seconds after you stop, then holds, however the bookkeeping underneath moves. */
	let driftSpent = 0;
	/* When the runtime started, so the image look-ahead can open narrow and widen (see `loadAheadFirst`). */
	let mountedAt = 0;
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
	function loadIfNear(w, y) {
		if (!w.deferred) return;
		const ahead = performance.now() - mountedAt < cfg.loadRampMs ? cfg.loadAheadFirst : cfg.loadAhead;
		if (Math.abs(y) > liveY * ahead) return;
		w.deferred = false;
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
		}
	}

	/* SAFETY NET. If the engine never reaches a work (an unexpected runtime failure, a browser that refuses
	   the 3D field), no photograph may stay stashed. One idle pass after load restores anything still
	   deferred, so the worst case is the pre-D-80 behaviour, never a missing image. */
	function releaseAllDeferred() {
		for (const w of works) loadIfNear(w, 0);
		for (const L of leads) loadIfNear(L, 0);
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
		if (Math.abs(y) > liveY && w.el !== focused) {
			if (w.visible) {
				w.visible = false;
				w.el.style.visibility = 'hidden';
				w.el.setAttribute('aria-hidden', 'true');
			}
			return;
		}
		if (!w.visible) {
			w.visible = true;
			w.el.style.visibility = 'visible';
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

		/* NEIGHBOUR HIERARCHY BY LIGHT, NOT BLUR (D-72 rev.2). `off` is 0 at square-on and 1 once a work has
		   turned sharpFalloff away; `turn` is its smoothstep. The whole FRONT hemisphere is razor sharp — the
		   hero is distinguished from its crisp neighbours purely by LUMINANCE: a front work dims as it turns
		   away (`neighborDim`, × depth so it only touches the front strand). `neighborBlur` is 0, so `angleBlur`
		   is 0 — kept as a seam only. The reading card is θ=0 → turn=0 → full brightness. */
		const off = Math.min(Math.abs(theta) / cfg.sharpFalloff, 1);
		const turn = off * off * (3 - 2 * off);
		const angleBlur = turn * cfg.neighborBlur * depth;
		const neighborLight = 1 - turn * cfg.neighborDim * depth;

		/* ENTRANCE & EXIT BY DEPTH (D-72). A work near the cull recedes on translateZ (`edgeSink`) and fades
		   (edgeSoft already dimmed the opacity above), so it ARRIVES from depth as it rises to centre and
		   DEPARTS into depth as it rides off — travel, not a pop, and without any defocus. */
		const edgeSink = edgeSoft * cfg.edgeSink;

		/* DEPTH OF FIELD — BACK HEMISPHERE ONLY (D-72 rev.2). `backAmt` is 0 across the entire front hemisphere
		   (z ≥ 0: front-facing AND side works) and ramps to 1 at the very back, so the focal plane is the whole
		   front of the coil and only the genuine back softens — "de foto's aan de voorkant niet geblurt". The
		   angle/edge terms are 0 by config now; kept in the sum as tunable seams. Quantised to whole pixels so a
		   still card caches one raster instead of rebuilding the filter every frame. */
		const backAmt = Math.max(0, -z / R);
		const blurPx = Math.round(Math.pow(backAmt, cfg.backGamma) * cfg.farBlur + angleBlur + edgeSoft * cfg.edgeBlurMax);
		/* SERIES LIFT (Phase 4, D-74). 0 for every loose work; for a series cover it rides on `read`, so the
		   extra light and scale ease in exactly as the cover turns square-on and out as it turns away. */
		const seriesRead = w.isSeries ? read : 0;
		/* THE COLOUR MATRIX — cheap, so it may change every frame. Quantised to 1% anyway (two decimals, not
		   three): a 1% step in a slow temporal luminance ramp is far below the eye's threshold, and it cuts the
		   number of style writes by roughly an order of magnitude. */
		const bright = (
			(1 + read * cfg.readBright + seriesRead * cfg.seriesReadBright + hv * cfg.hoverBright) *
			neighborLight
		).toFixed(2);
		const tone = [];
		if (Math.abs(parseFloat(bright) - 1) > 0.002) tone.push(`brightness(${bright})`);
		if (read > 0.002) {
			tone.push(`contrast(${(1 + read * cfg.readContrast).toFixed(2)})`);
			tone.push(`saturate(${(1 + read * cfg.readSat + seriesRead * cfg.seriesReadSat).toFixed(2)})`);
		}
		const toneStr = tone.length ? tone.join(' ') : '';
		if (toneStr !== w.lastTone) {
			w.lastTone = toneStr;
			w.tone.style.filter = toneStr;
		}

		/* THE DEPTH OF FIELD — expensive, so it lives alone on `.media`, the photograph's own untransformed
		   box, and changes only when the rounded pixel radius does. Never on the element the camera moves.
		   See the notes on `grade` and `tone` in mkNode for the measurements that decided both. */
		const filter = blurPx > 0 ? `blur(${blurPx}px)` : '';
		if (filter !== w.lastFilter) {
			w.lastFilter = filter;
			w.grade.style.filter = filter;
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
		const op = o.toFixed(3);
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
		const capO = Math.max(0, 1 - Math.abs(theta) / 0.3) * (1 - edgeSoft);
		const capStr = capO.toFixed(2);
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
		const goldStr = gold.toFixed(3);
		if (goldStr !== w.lastGold) {
			w.lastGold = goldStr;
			w.el.style.setProperty('--tv-gold', goldStr);
		}
	}

	function render() {
		const phi0 = journeyAngle();
		for (const w of works) place(w, phi0);
		for (const L of leads) place(L, phi0);
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
		if (viewportEl) viewportEl.style.visibility = e > 0.985 ? 'hidden' : '';
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

	function refreshRange() {
		let top = 0;
		for (let el = root; el; el = el.offsetParent) top += el.offsetTop;
		rangeTop = top;
		rangeUsable = Math.max(root.offsetHeight - window.innerHeight, 1);
	}

	function scrollRange() {
		return { top: rangeTop, usable: rangeUsable };
	}

	function readScroll() {
		if (programmaticY !== null && Math.abs(window.scrollY - programmaticY) <= 1) {
			// the re-base's own landing (see `programmaticY`): recompute the mapping, claim nothing else.
		} else {
			programmaticY = null;
			lastInput = performance.now(); // any real scroll resets the idle-drift timer
			rebaseArmed = true; // …and arms one settle-up of the accrued drift for when this gesture ends
			driftSpent = 0; // …and gives the coil a fresh eleven seconds of turning once they stop again
		}
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
			lastT = now;
			lastInput = now;
			frame = requestAnimationFrame(tick);
			return;
		}

		/* real seconds between frames, clamped so a backgrounded tab's catch-up frame cannot make the
		   ambient clock (and any future inertia) leap. */
		const dt = Math.min((now - lastT) / 1000, 0.05);
		lastT = now;
		clock += dt;

		/* AUTO-DRIFT + SPRING. The idle auto-drift (D-72) adds `autoOffset` to the scroll target, so the coil
		   keeps descending while the visitor is still — WITHOUT ever moving window.scrollY or the scrollbar.
		   effTarget is clamped to the works range so the drift can never run into the ending zone or past the
		   crown. `autoOffset` itself is updated below, eased by `life`. */
		rebaseDrift(now);
		const effTarget = Math.min(Math.max(target + autoOffset, 0), span);
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
		outro += (outroTarget - outro) * 0.12;
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

		/* LIFE — the idle amplitude for BOTH the camera sway and the auto-drift. It eases toward 1 once the
		   visitor has been still for idleDelay with the scroll settled and we are clear of the ending, and back
		   toward 0 on any input, so neither the float nor the drift ever fights an active scroll. `scrollSettled`
		   compares the SCROLL component of the journey (journey − autoOffset) against the scroll target, so a
		   still-settling teleport does not prematurely start the drift. */
		const scrollSettled = Math.abs(journey - autoOffset - target) < 0.06;
		const idle = now - lastInput > cfg.idleDelay && scrollSettled && outroTarget < 0.05;
		life = clampUnit(life + (idle ? 1 : -1) * ((dt * 1000) / cfg.idleRamp));

		/* THE COIL KEEPS TURNING (D-72). While the visitor is idle the journey drifts forward — `autoOffset`
		   grows, eased in by `life` — so the world keeps living instead of freezing. It is bounded by autoMax
		   and clamped so it can never pass the last work.
		   WHILE THE VISITOR SCROLLS IT IS SIMPLY FROZEN (P12 / D-84): nothing is subtracted from their input,
		   so the world travels exactly as far as the scrollbar does, at full gain, from the first frame. The
		   accumulated offset is settled up at rest instead, by `rebaseDrift`, where it cannot be felt. */
		if (idle && driftSpent < cfg.autoMax) {
			const step = cfg.autoSpeed * life * dt;
			autoOffset += step;
			driftSpent += step;
		}
		if (target + autoOffset > span) autoOffset = Math.max(span - target, 0);
		autoOffset = Math.min(Math.max(autoOffset, 0), cfg.autoMax);

		render();
		renderAmbient();
		/* INTEGRATION SEAM (Phase 3, D-73). One optional callback per frame, carrying the current journey (in
		   works), so the portfolio chrome — the wayfinding marker, the per-world ambient tint and the world-title
		   beats — reads the world from the SAME journey the coil is drawn from, without a second rAF that could
		   disagree. Guarded, so the engine is byte-identical for any caller that does not pass one, and it never
		   fires under reduced motion (the runtime is not mounted at all there). */
		if (cfg.onFrame) cfg.onFrame(journey, outro);
		frame = requestAnimationFrame(tick);
	}

	/*
	 * THE RE-BASE (P12 / D-84). See the note on `rebaseDelay` in CFG for why this exists at all.
	 *
	 * Runs only when the visitor has been still for `rebaseDelay` AND the coil has settled — i.e. when
	 * nothing is moving and nothing can therefore be seen to move. It adds the drift's own distance to
	 * `window.scrollY` and removes exactly that much from `autoOffset`, so `target + autoOffset` — the
	 * only quantity the camera reads — is unchanged to the pixel. There is no frame on which the world
	 * jumps, because there is no frame on which the sum differs.
	 *
	 * DELIBERATELY NOT ON THE INPUT EVENT. Doing this on the first `wheel` of a gesture would be tidier in
	 * principle and worse in practice: Chrome animates a wheel notch on the compositor, and a scrollTo
	 * lands in the middle of that animation and cancels it, so the visitor's first notch would silently
	 * do less than they asked. At rest there is no animation to interrupt.
	 *
	 * `lastInput` is preserved across the programmatic scroll: `readScroll` treats every scroll as visitor
	 * input (it drives the idle timer), and this scroll is not the visitor's.
	 */
	function rebaseDrift(now) {
		if (!rebaseArmed || autoOffset < 0.0005) return;
		if (now - lastInput < cfg.rebaseDelay) return;
		if (Math.abs(journey - target - autoOffset) > 0.004) return; // still settling — wait
		const worksUsable = Math.max(rangeUsable - outroPx, 1);
		const pxPerWork = worksUsable / span;
		if (!Number.isFinite(pxPerWork) || pxPerWork <= 0) return;
		const maxY = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
		const from = window.scrollY;
		const to = Math.min(from + autoOffset * pxPerWork, maxY);
		const applied = (to - from) / pxPerWork;
		if (applied < 0.0005) {
			/* At the foot of the document there is no scroll left to re-base onto, and there never will be
			   until the visitor scrolls again — so disarm. Without this the guard above passes on every frame
			   and `scrollHeight` is read on every frame, forcing a layout each time (the engine has just
			   written a transform, so layout is always dirty here). The offset simply stays; it is bounded,
			   invisible, and the next gesture arms a fresh attempt. */
			rebaseArmed = false;
			return;
		}
		const keepInput = lastInput;
		programmaticY = to;
		window.scrollTo({ top: to, behavior: 'instant' });
		readScroll();
		lastInput = keepInput; // this scroll is ours, not the visitor's: it must not restart the idle timer
		rebaseArmed = false; // …and it must not re-arm itself, or the drift becomes a self-scrolling tour
		autoOffset = Math.max(autoOffset - applied, 0);
	}

	/* THE AMBIENT DRIFT. A slow parallax of the camera only — the perspective-origin traces a gentle
	   Lissajous, so the coil floats without a single photograph rotating, cropping or leaving its reading
	   angle. Two incommensurate periods keep the path from ever repeating a straight sweep. `life` is
	   smootherstepped so the drift has no hard start or stop. LIFE HOOK: hover-lift and per-work inertia
	   would layer on here, added to each work's transform in place() rather than to the camera. */
	function renderAmbient() {
		if (!viewportEl) return;
		const a = life * life * (3 - 2 * life);
		const amp = cfg.swayAmp * a;
		const ox = Math.sin((clock / cfg.swayPeriodX) * Math.PI * 2) * amp;
		const oy = Math.cos((clock / cfg.swayPeriodY) * Math.PI * 2) * amp * 0.6;
		/* GATED (P12 / D-84). `perspective-origin` lives on the element that establishes the coil's 3D
		   context, so writing it invalidates the computed style of every work under it — and it was written
		   on EVERY frame, including the ~95% of frames where `life` is 0 and the value is the unchanged
		   "50.00% 50.00%". Writing only on change costs one string compare and takes that invalidation off
		   the whole of active scrolling, which is exactly when it was least affordable. */
		const origin = `${(50 + ox).toFixed(2)}% ${(50 + oy).toFixed(2)}%`;
		if (origin !== lastOrigin) {
			lastOrigin = origin;
			viewportEl.style.perspectiveOrigin = origin;
		}
	}

	/* Keyboard: focusing a work travels the camera to its reading moment. Native scroll does the moving,
	   so focus, scrollbar and camera can never disagree. */
	function focusWork(index, smooth = true) {
		const w = works[Math.min(Math.max(index, 0), works.length - 1)];
		if (!w) return;
		/* An intentional navigation to a specific work (keyboard focus, a wayfinding jump, a project return)
		   must land EXACTLY on that work. The idle auto-drift (autoOffset) is an ambient offset added to the
		   spring target; left in place it would carry the arrival past the intended work by up to autoMax
		   (measured: a jump to work 48 landed on 50 after the coil had idled). Clearing it here makes the
		   arrival exact and honest — the drift is meant to breathe from a RESTING place, not to corrupt a
		   deliberate move. scrollY is set below, so the scrollbar and journey stay in agreement. */
		autoOffset = 0;
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
		lastInput = performance.now(); // keyboard travel resets the idle-drift timer too
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
		if (e.target.closest('[data-tv-work]') === focused) focused = null;
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
				/* The position to come BACK to is where the WORLD is, not where the scrollbar is. Any drift
				   that has not yet been re-based (P12 / D-84) sits between the two, so it is folded in here —
				   otherwise a visitor who paused to look, then opened a project, returned up to 0.9 works
				   behind the photograph they left. `start()` restores this number and zeroes autoOffset, so
				   the sum is exactly the frame they were on. */
				const worksUsable = Math.max(rangeUsable - outroPx, 1);
				const y = window.scrollY + autoOffset * (worksUsable / span);
				sessionStorage.setItem(RETURN_Y_KEY, String(Math.round(y)));
			} catch {
				/* ignore */
			}
		}
	}

	/* ---- hover (pointer devices only) ---------------------------------------------------------- */

	function onPointerOver(e) {
		const el = e.target.closest('[data-tv-work]');
		if (el) hovered = el;
	}
	function onPointerOut(e) {
		/* Only clear when the pointer actually leaves the hovered work — pointerout also fires when moving
		   between the work's own descendants, and relatedTarget still inside it means we have not left. */
		const to = e.relatedTarget;
		if (hovered && (!to || !hovered.contains(to))) {
			if (e.target.closest('[data-tv-work]') === hovered) hovered = null;
		}
	}

	/* ---- lifecycle ----------------------------------------------------------------------------- */

	let resizeRaf = 0;
	function onResize() {
		cancelAnimationFrame(resizeRaf);
		resizeRaf = requestAnimationFrame(() => {
			measure();
			readScroll();
			render();
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
			autoOffset = 0;
			render();
		};
		place();
		readScroll();
		journey = target;
		clock = 0;
		lastT = 0;
		life = 0;
		autoOffset = 0;
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
		frame = requestAnimationFrame(tick);
		/* The cached scroll range is measured in measure(), which runs before the footer's own imagery and the
		   fonts have settled. One refresh at load costs a single layout and keeps the cache honest without ever
		   putting a layout read back on the scroll path (P10 / D-81). */
		if (document.readyState !== 'complete')
			window.addEventListener('load', () => { refreshRange(); readScroll(); }, { once: true });
		window.addEventListener('scroll', readScroll, { passive: true });
		window.addEventListener('resize', onResize, { passive: true });
		root.addEventListener('keydown', onKey);
		root.addEventListener('focusin', onFocusIn);
		root.addEventListener('focusout', onFocusOut);
		root.addEventListener('click', onProjectLink, true);
		if (canHover && stage) {
			stage.addEventListener('pointerover', onPointerOver);
			stage.addEventListener('pointerout', onPointerOut);
		}
	}

	function stop() {
		running = false;
		cancelAnimationFrame(frame);
		delete root.dataset.tvActive;
		/* The document goes back to being the single accessible column, where every photograph is simply
		   present — so nothing may stay stashed behind the coil's load window (P9 / D-80). */
		releaseAllDeferred();
		if (viewportEl) {
			viewportEl.style.perspectiveOrigin = '';
			viewportEl.style.visibility = '';
		}
		if (stage) {
			stage.style.opacity = '';
			stage.style.transform = '';
		}
		window.removeEventListener('scroll', readScroll);
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
			w.grade.style.filter = ''; // depth of field lives on .media now (P10 / D-81)
			w.tone.style.filter = ''; // …and the colour matrix on the <img>
			w.hoverF = 0;
			w.lastFilter = null;
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
