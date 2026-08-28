/*
 * PORTFOLIO CHROME — the integration layer over DE DOORTOCHT (Phase 3, D-73).
 *
 * WHAT THIS IS, AND WHAT IT IS NOT. This is the 2D layer that gives the coil the structure, identity and
 * wayfinding of a finished portfolio: the world rail, the corner orientation mark and the ambient per-world
 * light. (P14 replaced the collapsed marker + dropdown and the full-viewport world-title beat with a rail and
 * deleted the entrance curtain outright; P15 reduced the rail to a corner MARK — three words, no panel — and
 * moved the world-crossing announcement onto it.) It NEVER touches the Interaction Engine's geometry, camera or
 * physics (traverse.js is the frozen foundation). It reads the world from the SAME journey the coil is drawn
 * from — via the engine's `onFrame` seam — so the two can never disagree, and it drives the coil's camera
 * only through the engine's own public `focusWork()`.
 *
 * PROGRESSIVE ENHANCEMENT. Under reduced motion / no JS the engine never mounts, `onFrame` never fires, and
 * the chrome elements are hidden by CSS (they show only under `[data-tv-active]`). The three headed <section>
 * chapters in the document then carry the wayfinding, and the rail's three worlds degrade to exactly what
 * they are in the markup: real #work-<id> anchors into that document.
 *
 * THE WORLD'S ONE RULE IS RESPECTED. Nothing here is placed inside the coil. The tint is the near-black
 * BEHIND the ribbon (a background on the fixed viewport, shown only in the gaps between photographs); it can
 * never fall on a photograph, which is opaque and painted on top. Priority 1 is protected by construction.
 */

/**
 * Mount the chrome for one portfolio root. Returns `{ onFrame }` — the per-frame callback the engine calls
 * with the current journey (in works). Safe to call before the engine mounts; if there are no worlds it is
 * an inert no-op.
 */
export function mountChrome(root) {
	const dataEl = root.querySelector('[data-tv-worlds]');
	let worlds = [];
	try {
		worlds = JSON.parse(dataEl?.textContent || '[]');
	} catch {
		worlds = [];
	}
	if (!worlds.length) return { onFrame() {} };

	/* P14 replaced the collapsed marker + its dropdown panel + the journey map with one rail carrying all
	   three worlds at once; P15 reduced that rail to a corner MARK — three words, no box (see the note in
	   the page markup and in portfolio-chrome.css §3b). Either way there is no open/closed state to hold, no
	   outside-click handler and no Escape handler, because there is nothing to close. */
	const jumps = Array.from(root.querySelectorAll('[data-pf-jump]'));
	const note = root.querySelector('[data-pf-note]');
	const noteName = root.querySelector('[data-pf-note-name]');
	const noteSub = root.querySelector('[data-pf-note-sub]');
	const intro = root.querySelector('[data-pf-intro]');
	const progressFill = root.querySelector('[data-pf-progress-fill]');
	const node = root.querySelector('[data-pf-node]');

	/* The whole coil's length in works — the denominator for overall progress and for mapping a click on the
	   journey map to a work index. Derived from the last world's boundary, so it holds at any collection. */
	const lastWorld = worlds[worlds.length - 1];
	const totalWorks = Math.max(lastWorld.start + lastWorld.count, 1);

	/* ---- THE WORLD'S LIGHT per world (Fase 5, D-75) — the modelled blue-hour space behind the coil ----
	 * Before Fase 5 the environment was one FLAT near-black tint a hair off the page ink — deliberately
	 * sub-threshold, and precisely the atmosphere the owner found missing. It is now a genuinely MODELLED,
	 * clearly-visible blue-hour WORLD (the `.tv-sky` layer stack), lit by WHERE you are in the journey exactly
	 * as the homepage sky is lit by altitude (Cinematic Motion Language §5.1–5.3). The light arc is Leo's own,
	 * read off the photographs: the crown opens at blue hour, the Architectuur exteriors deepen into the full
	 * blue-hour nocturne, and the Interieur foot lands in warm interior light. We drive ONLY the layers'
	 * OPACITY (never a per-frame gradient repaint), so a continuously evolving, genuinely visible world costs
	 * nothing (§5.2, compositor-only, CLS-safe). The values ease CONTINUOUSLY between world centres, so the
	 * discipline change is FELT as a change of light before it is read (§4.2). Every peak stays below the
	 * luminance/saturation of any photograph (6.16) and lives only in the negative space — a front-facing
	 * work is opaque and painted on top, so the world can never fall on the photography (priority 1). */
	const LIGHT = {
		projecten: { cool: 0.92, warm: 0.05 }, // the opening blue hour, a whisper of the coming warmth
		architectuur: { cool: 1.0, warm: 0.0 }, // the deep blue-hour nocturne (his blue-hour exteriors)
		interieur: { cool: 0.24, warm: 1.0 }, // warm interior light — the landing
	};
	const fallbackLight = { cool: 0.85, warm: 0.08 };
	const lightOf = (id) => LIGHT[id] || fallbackLight;

	const centers = worlds.map((w) => w.start + w.count / 2);
	const lerp = (a, b, t) => a + (b - a) * t;
	const smooth = (t) => t * t * (3 - 2 * t);
	const lightAt = (j) => {
		if (j <= centers[0]) return lightOf(worlds[0].id);
		const last = centers.length - 1;
		if (j >= centers[last]) return lightOf(worlds[last].id);
		for (let i = 0; i < last; i++) {
			if (j >= centers[i] && j <= centers[i + 1]) {
				const t = smooth((j - centers[i]) / (centers[i + 1] - centers[i] || 1));
				const a = lightOf(worlds[i].id);
				const b = lightOf(worlds[i + 1].id);
				return { cool: lerp(a.cool, b.cool, t), warm: lerp(a.warm, b.warm, t) };
			}
		}
		return lightOf(worlds[last].id);
	};

	/*
	 * THE PER-FRAME CUSTOM PROPERTIES GO ON THE ELEMENTS THAT READ THEM, NEVER ON THE COIL'S ROOT
	 * (P13 / D-85). This is the single change that took a portfolio scroll from recalculating the style of
	 * 92% of the page every frame to recalculating 11% of it, and it is not about how much these four
	 * values cost to compute — it is about WHICH ELEMENT they are declared on.
	 *
	 * A custom property is INHERITED. Setting one on an element therefore dirties the computed style of that
	 * element AND of every descendant, because the engine cannot know which of them reads it. `root` here is
	 * the portfolio container — the ancestor of all 63 photograph panels and their pictures, sources, images,
	 * captions and mount lines. So four scalars intended for four full-bleed sky layers were invalidating the
	 * entire coil, on every frame of every scroll, and defeating all of traverse.js's careful per-work write
	 * gating in the process.
	 *
	 * MEASURED on the built page, headful-equivalent 1440x900 at dpr 2, CPU throttled 4x, scrolling the coil
	 * continuously for 2.5s:
	 *
	 *     four vars on the coil root      724 elements restyled/frame   9.9ms median   768ms total
	 *     the same four, scoped here       83 elements restyled/frame   2.3ms median   208ms total
	 *
	 * The engine's own rAF callback measured 1.1ms in both runs: the work was never the JavaScript, it was
	 * the invalidation the JavaScript caused. Worst main-thread task in the run fell 19.4ms -> 14.3ms.
	 *
	 * WHY NOT `@property { inherits: false }`. That is the textbook fix and it is wrong here: measured in
	 * this Chrome, a non-inherited registered custom property declared on an element does NOT reach that
	 * element's `::after` — and `--tv-gold` (traverse.js) is read by exactly such a pseudo-element. The
	 * gold mount line would silently stop appearing. Scoping by ELEMENT is exact and needs no registration.
	 *
	 * Nothing about the world changes: the same properties, the same values, the same quantisation, read by
	 * the same rules. `--tv-sky-o` is read by `.tv-sky`, `--tv-cool` by `.tv-sky__cool`, `--tv-warm` by
	 * `.tv-sky__warm` and `--descent` by `.tv-sky__vignette` — each is now declared on its own reader, whose
	 * subtree is empty. If a layer is missing from the document the write falls back to the root, so a
	 * template change can never silently drop the world's light.
	 */
	const varHost = {
		'--tv-sky-o': root.querySelector('.tv-sky'),
		'--tv-cool': root.querySelector('.tv-sky__cool'),
		'--tv-warm': root.querySelector('.tv-sky__warm'),
		'--descent': root.querySelector('.tv-sky__vignette'),
	};

	/* Write a normalised (0..1-ish) custom property, gated on change so a still coil writes nothing. Quantised
	   to 0.001 — finer than the eye can read as a step, coarser than every sub-pixel frame. */
	const lastVar = Object.create(null);
	const writeVar = (name, v) => {
		const q = Math.round(v * 1000) / 1000;
		if (lastVar[name] === q) return;
		lastVar[name] = q;
		(varHost[name] || root).style.setProperty(name, String(q));
	};

	/* ---- travelling to a world (§5.2) -------------------------------------------------------------
	 * A jump is INSTANT and POSITIONAL: drive the engine's own camera to the world's first work with no
	 * smooth glide — gliding across many works is the documented nausea source §5.2 rules out. Unchanged
	 * from D-73; only what the visitor clicks to get here is different.
	 * When the engine is not mounted (reduced motion, or a runtime failure) we do NOT preventDefault, so the
	 * real #work-<id> anchor navigates natively in the in-flow document and the control still works. */
	jumps.forEach((j) => {
		j.addEventListener('click', (e) => {
			const inst = window.__tv && window.__tv.instance;
			const idx = parseInt(j.dataset.pfIndex, 10);
			if (inst && typeof inst.focusWork === 'function' && Number.isFinite(idx)) {
				e.preventDefault();
				inst.focusWork(idx, false);
			}
		});
	});

	/* ---- the orientation mark recedes on the first sign of travel --------------------------------
	 * All that is left of the D-78 opening state is this: the corner orientation mark (brand + "Portfolio")
	 * eases away the moment the visitor begins to descend. The veil it used to travel with is deleted, the
	 * caption stand-down with it, and the world rail is no longer HELD BACK — a navigation control that only
	 * appears once you have already started moving is one you can only find by accident, and with the brand
	 * panel gone there is nothing left for it to compete with. It arrives with the world instead (a CSS
	 * delay on the same beat the coil emerges on), so the first complete screen already contains the way
	 * around. See portfolio-chrome.css §3b.
	 * `pointerdown` is deliberately in the list even though it is not travel: on a phone the first contact
	 * with the screen is the intent to move, and waiting for the scroll to register leaves the mark sitting
	 * over a world the reader has already started dragging. */
	let openingGone = false;
	const beginJourney = () => {
		if (openingGone) return;
		openingGone = true;
		intro?.classList.add('is-gone');
		inputEvents.forEach((t) => window.removeEventListener(t, beginJourney));
		window.removeEventListener('scroll', onScrollBegin);
	};
	const onScrollBegin = () => {
		if (window.scrollY > 4) beginJourney();
	};
	const inputEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
	inputEvents.forEach((t) => window.addEventListener(t, beginJourney, { passive: true }));
	window.addEventListener('scroll', onScrollBegin, { passive: true });

	/* The idle auto-drift can carry the coil onward without the reader touching anything (D-72), so the
	   opening also ends on DISTANCE, not only on input — otherwise a visitor who simply watches is left
	   reading the orientation mark over a world that has already moved on. Checked in onFrame, which is
	   where the journey value already lives. (On a touch device the drift is off — see TOUCH_CFG in
	   traverse.js — so there the input listeners above are the whole story.) */

	/* ---- crossing into a world ---------------------------------------------------------------------
	 * P14: this used to be the world-title BEAT — a full-viewport fixed layer carrying a radial scrim and a
	 * display-size heading, eased in for 2.2s on every boundary. It is the "same interruption again when
	 * changing worlds" the owner reports, and the diagnosis is the same as for the entrance: a world change
	 * is NAVIGATION, and navigation feedback belongs to the navigation, not to a layer over the photographs.
	 * The rail already says which world you are in (the active segment lights and takes the gold rule); all
	 * this adds is the world's own one-line descriptor, on the rail, for a beat. Nothing covers the coil,
	 * nothing dims it, and travelling between worlds now reads as moving through one portfolio rather than
	 * as arriving at a new page. */
	let noteTimer = 0;
	const fireNote = (w) => {
		if (!note) return;
		if (noteName) noteName.textContent = w.label;
		if (noteSub) noteSub.textContent = w.sub;
		note.classList.remove('is-visible');
		void note.offsetWidth; // restart the transition even on a rapid re-entry
		note.classList.add('is-visible');
		clearTimeout(noteTimer);
		/* 2600ms, up from 1800 (P15). The beat now carries the world's NAME as well as its descriptor, and
		   a name the reader has to catch inside 1.8s while a coil is moving is a name most readers miss —
		   which is a large part of why the boundary was reported as not clearly marked. It is still a beat:
		   it releases on its own, it never blocks anything, and the active word's own lit state is what
		   remains afterwards. */
		noteTimer = window.setTimeout(() => note.classList.remove('is-visible'), 2600);
	};

	/* Which world holds the reading work — the last world whose start index the journey has reached. */
	const worldIndexAt = (j) => {
		const r = Math.round(j);
		let k = 0;
		for (let i = 0; i < worlds.length; i++) if (r >= worlds[i].start) k = i;
		return k;
	};

	/* ---- the per-frame update (writes gated on change, so a still coil writes nothing) ----------- */
	let lastWorldIdx = -1;
	let lastProgress = -1;
	let ending = false;

	const onFrame = (journey, outro = 0) => {
		if (!openingGone && journey > 0.9) beginJourney();

		/* At the ending the coil dissolves into the contact invitation (§3.5); the chrome recedes with it so
		   no world rail floats over the footer. Gated on change so a still frame writes nothing. */
		const nowEnding = outro > 0.12;
		if (nowEnding !== ending) {
			ending = nowEnding;
			root.classList.toggle('is-tv-ending', ending);
		}

		/* THE WORLD'S LIGHT (Fase 5, D-75). Cross-fade the blue-hour and warm sky layers by journey, deepen the
		   vignette as the landing nears, and dissolve the whole modelled world WITH the coil at the ending so
		   the hand-off to the contact invitation is a fade, not a snap when the engine hides the viewport. All
		   four are OPACITY/scalar writes (compositor-only) and gated on change. `frac` is the overall descent,
		   reused below for the progress hairline. */
		const frac = Math.min(Math.max(journey / Math.max(totalWorks - 1, 1), 0), 1);
		const L = lightAt(journey);
		const e = outro <= 0 ? 0 : outro * outro * (3 - 2 * outro); // smoothstep — matches the engine's outro
		writeVar('--tv-cool', L.cool);
		writeVar('--tv-warm', L.warm);
		writeVar('--descent', frac);
		writeVar('--tv-sky-o', 1 - e);

		/* OVERALL PROGRESS (Phase 4). The rail's hairline fills and its node slides as the visitor descends
		   the whole coil — the same two writes as before, now on the rail that also carries the worlds, which
		   is what let the separate journey map inside the old dropdown be deleted rather than moved.
		   Quantised to 0.1%, so a still or barely-moving coil writes nothing. */
		const pct = Math.round(frac * 1000) / 10;
		if (pct !== lastProgress) {
			lastProgress = pct;
			if (progressFill) progressFill.style.transform = `scaleX(${frac.toFixed(4)})`;
			if (node) node.style.left = `${pct}%`;
		}

		const k = worldIndexAt(journey);
		if (k !== lastWorldIdx) {
			const w = worlds[k];
			jumps.forEach((j, i) => {
				if (i === k) j.setAttribute('aria-current', 'true');
				else j.removeAttribute('aria-current');
			});
			// The rail's own state IS the announcement of the first world; the descriptor line fires only on
			// genuine ENTRY into a subsequent world (including a jump back), never at load.
			if (lastWorldIdx !== -1) fireNote(w);
			lastWorldIdx = k;
		}

		/* P9 (D-80): the call to `dropHint()` that stood here was a leftover of the scroll hint deleted in
		   D-78 — the function went with the hint, the call did not. Because onFrame runs inside the engine's
		   rAF loop, the ReferenceError it threw the first time the visitor scrolled past ~0.55 works TORE DOWN
		   THE WHOLE LOOP: the coil froze at that journey and stayed frozen for the rest of the page, however far
		   the visitor scrolled. Removed, not guarded — there is nothing left to call. */
	};

	return { onFrame };
}
