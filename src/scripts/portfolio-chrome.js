/*
 * PORTFOLIO CHROME — the integration layer over DE DOORTOCHT (Phase 3, D-73).
 *
 * WHAT THIS IS, AND WHAT IT IS NOT. This is the 2D layer that gives the coil the structure, identity and
 * wayfinding of a finished portfolio: the persistent wayfinding marker, the ambient per-world tint, the
 * world-title beats, and the scroll hint. It NEVER touches the Interaction Engine's geometry, camera or
 * physics (traverse.js is the frozen foundation). It reads the world from the SAME journey the coil is drawn
 * from — via the engine's `onFrame` seam — so the two can never disagree, and it drives the coil's camera
 * only through the engine's own public `focusWork()`.
 *
 * PROGRESSIVE ENHANCEMENT. Under reduced motion / no JS the engine never mounts, `onFrame` never fires, and
 * the chrome elements are hidden by CSS (they show only under `[data-tv-active]`). The three headed <section>
 * chapters in the document then carry the wayfinding, and the jump items degrade to real #work-<id> anchors.
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

	const wayfind = root.querySelector('[data-pf-wayfind]');
	// P8.7 (D-78): held back until the visitor actually travels — see `beginJourney` below.
	wayfind?.classList.add('is-held');
	// The opening is a STATE, not just two elements: while it lasts the coil's own captions stand down too,
	// so the overture is the only thing being read. Removed on the first travel, with everything else.
	root.classList.add('is-overture');
	const toggle = root.querySelector('[data-pf-toggle]');
	const list = root.querySelector('[data-pf-list]');
	const nowEl = root.querySelector('[data-pf-now]');
	const posEl = root.querySelector('[data-pf-pos]');
	const jumps = Array.from(root.querySelectorAll('[data-pf-jump]'));
	const beat = root.querySelector('[data-pf-beat]');
	const beatName = root.querySelector('[data-pf-beat-name]');
	const beatSub = root.querySelector('[data-pf-beat-sub]');
	// P8.7 (D-78): the scroll hint is deleted; the overture veil takes its slot in the opening.
	const veil = root.querySelector('[data-pf-veil]');
	const intro = root.querySelector('[data-pf-intro]');
	const progressFill = root.querySelector('[data-pf-progress-fill]');
	const map = root.querySelector('[data-pf-map]');
	const mapNode = root.querySelector('[data-pf-node]');

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

	/* Write a normalised (0..1-ish) custom property, gated on change so a still coil writes nothing. Quantised
	   to 0.001 — finer than the eye can read as a step, coarser than every sub-pixel frame. */
	const lastVar = Object.create(null);
	const writeVar = (name, v) => {
		const q = Math.round(v * 1000) / 1000;
		if (lastVar[name] === q) return;
		lastVar[name] = q;
		root.style.setProperty(name, String(q));
	};

	/* ---- wayfinding marker: expand / collapse (§7.4) ---------------------------------------------
	 * Static text; the only thing that ever animates is the list opening on the visitor's own click. */
	let open = false;
	const setOpen = (v) => {
		open = v;
		if (toggle) toggle.setAttribute('aria-expanded', String(v));
		if (list) list.hidden = !v;
		if (wayfind) wayfind.classList.toggle('is-open', v);
	};
	if (toggle) toggle.addEventListener('click', () => setOpen(!open));
	document.addEventListener('click', (e) => {
		if (open && wayfind && !wayfind.contains(e.target)) setOpen(false);
	});
	document.addEventListener('keydown', (e) => {
		if (open && e.key === 'Escape') {
			setOpen(false);
			toggle?.focus();
		}
	});

	/* A jump is INSTANT and POSITIONAL (§5.2): drive the engine's own camera to the world's first work with
	   no smooth glide. When the engine is not mounted (reduced motion), we do not preventDefault, so the real
	   #work-<id> anchor navigates natively in the in-flow document. */
	jumps.forEach((j) => {
		j.addEventListener('click', (e) => {
			const inst = window.__tv && window.__tv.instance;
			const idx = parseInt(j.dataset.pfIndex, 10);
			if (inst && typeof inst.focusWork === 'function' && Number.isFinite(idx)) {
				e.preventDefault();
				inst.focusWork(idx, false);
				setOpen(false);
			}
		});
	});

	/* THE MAP — click anywhere on the journey to travel there instantly (§5.2, Phase 4). Pointer-only fine
	   travel; the labelled list above is the keyboard/AT equivalent, so the map is aria-hidden. A click maps
	   its x position to a work index and drives the engine's own camera via focusWork — instant and
	   positional, never a glide across many works (the documented nausea source §5.2). The far-left is the way
	   back to the beginning. When the engine is not mounted (reduced motion) the map is hidden, so this is
	   inert there. */
	if (map) {
		map.addEventListener('click', (e) => {
			const inst = window.__tv && window.__tv.instance;
			if (!inst || typeof inst.focusWork !== 'function') return;
			const r = map.getBoundingClientRect();
			const f = Math.min(Math.max((e.clientX - r.left) / Math.max(r.width, 1), 0), 1);
			inst.focusWork(Math.round(f * (totalWorks - 1)), false);
			setOpen(false);
		});
	}

	/* ---- the opening recedes on the first sign of travel ----------------------------------------- */
	/* THE OPENING IS ONE BEAT, AND IT ENDS ON THE FIRST TRAVEL (P8.7 / D-78).
	   The overture (brand + title + lede) and the veil that quiets the coil behind it belong to the crown;
	   the wayfinding marker belongs to the journey. All three are governed from here so they can never
	   disagree: the moment the visitor begins to descend — any input, or any real scroll — the overture and
	   the veil ease away TOGETHER and the marker arrives. One signal, three consequences, in the order a
	   reader experiences them.
	   `pointerdown` is deliberately in the list even though it is not travel: on a phone the first contact
	   with the screen is the intent to move, and waiting for the scroll to register leaves the veil sitting
	   over a world the reader has already started dragging. */
	let openingGone = false;
	const beginJourney = () => {
		if (openingGone) return;
		openingGone = true;
		veil?.classList.add('is-gone');
		intro?.classList.add('is-gone');
		wayfind?.classList.remove('is-held');
		root.classList.remove('is-overture');
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
	   reading the overture over a world that has already moved on. Checked in onFrame, which is where the
	   journey value already lives. */

	/* ---- world-title beat ------------------------------------------------------------------------ */
	let beatTimer = 0;
	const fireBeat = (w) => {
		if (!beat) return;
		if (beatName) beatName.textContent = w.label;
		if (beatSub) beatSub.textContent = w.sub;
		beat.classList.remove('is-visible');
		void beat.offsetWidth; // restart the transition even on a rapid re-entry
		beat.classList.add('is-visible');
		clearTimeout(beatTimer);
		beatTimer = window.setTimeout(() => beat.classList.remove('is-visible'), 2200);
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
		   no wayfinding marker floats over the footer. Gated on change so a still frame writes nothing. */
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

		/* OVERALL PROGRESS (Phase 4). The marker's hairline fills and the map's node slides as the visitor
		   descends the whole coil. Quantised to 0.1%, so a still or barely-moving coil writes nothing. */
		const pct = Math.round(frac * 1000) / 10;
		if (pct !== lastProgress) {
			lastProgress = pct;
			if (progressFill) progressFill.style.transform = `scaleX(${frac.toFixed(4)})`;
			if (mapNode) mapNode.style.left = `${pct}%`;
		}

		const k = worldIndexAt(journey);
		if (k !== lastWorldIdx) {
			const w = worlds[k];
			if (nowEl) nowEl.textContent = w.label;
			if (posEl) posEl.textContent = `${k + 1} / ${worlds.length}`;
			jumps.forEach((j, i) => {
				if (i === k) j.setAttribute('aria-current', 'true');
				else j.removeAttribute('aria-current');
			});
			// The opening intro announces the first world; the beat fires only on genuine ENTRY into a
			// subsequent world (including a jump back), never on the initial assignment at load.
			if (lastWorldIdx !== -1) fireBeat(w);
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
