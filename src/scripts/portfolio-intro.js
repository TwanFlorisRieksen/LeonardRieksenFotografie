/*
 * PORTFOLIO INTRO — the premium entrance over DE DOORTOCHT (Phase 4, D-74).
 *
 * THE PROBLEM IT SOLVES. Before Phase 4 the coil appeared "technically": the baseline column flipped to the
 * fixed 3D field the instant the runtime mounted, and the visitor watched a scatter of empty dark rectangles
 * fill in one photograph at a time as the imagery decoded. That is the "lege implementatie" the owner flagged
 * — a website assembling itself in front of you, the opposite of a considered arrival.
 *
 * THE DESIGN. A full-bleed brand OVERTURE holds from the very first paint (it is server-rendered and shown by
 * CSS the moment `html.js` is set, so there is no flash of the bare document). While it holds, the crown's
 * priority imagery decodes and a hairline of light draws to full — loading BECOMES the moment, with no spinner,
 * bar or percentage. When the world is ready (or a hard cap elapses), the overture dissolves as the coil
 * EMERGES: the field resolves out of a soft, dark, slightly-scaled blur into its resting focus. The chrome
 * (opening lead, marker, hint) eases in last, after the world has arrived.
 *
 * WHAT IT DOES NOT TOUCH. The Interaction Engine (traverse.js — geometry, camera, physics) is the frozen
 * foundation. This controller only GATES when the engine mounts and orchestrates CSS state on the root; the
 * emergence itself is a one-shot CSS animation on the field container, never a per-work transform (the engine
 * owns those). Under reduced motion / no-JS the whole cinematic path is skipped: the engine mounts immediately
 * (a no-op under reduced motion, where the accessible chaptered document is the experience) and the CSS keeps
 * the overture hidden, so nothing here can ever block a photograph.
 */

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {Element} root  the [data-tv-root] portfolio container
 * @param {{ mount: () => void }} opts  `mount` starts the traverse engine (+ chrome onFrame wiring)
 */
export function mountIntro(root, opts) {
	const mount = opts && typeof opts.mount === 'function' ? opts.mount : () => {};
	const overture = root.querySelector('[data-pf-overture]');
	const fill = root.querySelector('[data-pf-load-fill]');

	/* Reduced motion, or a document without the overture: no cinematic entrance. Mount straight away — under
	   reduced motion the engine refuses to mount and the headed chapters are the experience; the overture is
	   CSS-hidden in both cases, so nothing is left covering the page. */
	if (prefersReduced() || !overture) {
		mount();
		return;
	}

	/* THE FIRST ARRIVAL IS THE CINEMATIC ONE. On the first portfolio visit of a session the overture is a felt
	   moment (~900ms floor). On a later visit in the same session the imagery is cached and the visitor has
	   already seen the arrival, so the floor drops to a brief, smooth hand-off rather than a repeated wait —
	   premium is also respecting the returning visitor's time. sessionStorage, so a fresh session is cinematic
	   again; wrapped in try/catch for privacy modes that throw on access. */
	let seen = false;
	try {
		seen = sessionStorage.getItem('pf-overture-seen') === '1';
	} catch {
		/* ignore */
	}
	const MIN_SHOW = seen ? 260 : 900; // ms floor the overture is shown
	const MAX_WAIT = 4200; // ms hard cap so a slow connection still proceeds to a live world
	const start = performance.now();

	/* MOUNT FIRST, REVEAL WHEN THE CROWN IS DECODED (P9 / D-80).
	   Until D-80 the engine was mounted at reveal time and the curtain waited on whichever images the MARKUP
	   had started — which, because every panel's layout box sits inside the fixed stage, was essentially the
	   whole archive at the wrong size (see the deferral script in portfolio/index.astro). Now nothing in the
	   coil is fetched from the markup at all: the ENGINE decides what to request, at the exact size it will
	   present it, for the works actually near the camera. So the engine has to be running before there is
	   anything to wait for. It is mounted here, behind the curtain, where none of it is visible; the emergence
	   state is applied at reveal, so the arrival the visitor sees is unchanged. */
	mount();

	/* THE PRIORITY SET — the crown works whose imagery must be present before the world is revealed: exactly
	   the photographs the engine has just claimed (their srcset is restored, so `currentSrc` will resolve).
	   Anything still stashed is far enough along the ribbon that it cannot be seen at the crown, and waiting
	   on it would stall the reveal to the hard cap for no visible gain. */
	/* P12 (D-84): the set is the CROWN, not the first six works.
	   It was `[data-tv-work] img`, i.e. the six works first in DOCUMENT order — which are the six the coil
	   travels to FIRST, not the six it is currently showing. What actually fills the top of the frame at
	   journey 0 is those first works PLUS the decorative lead-ins, the clones placed at negative ribbon
	   angle precisely so the coil "already exists" above the crown. Waiting on none of the lead-ins is why
	   the curtain lifted on a coil with its whole upper half still blank — measured on the filmstrip at
	   1.6 Mbps: two or three photographs in an otherwise empty dark frame, which is the "lege implementatie"
	   the overture exists to prevent. Same number of images waited on; the right ones. */
	const restored = (sel) =>
		Array.from(root.querySelectorAll(sel)).filter((img) => !img.hasAttribute('data-tv-srcset'));
	const priorityImgs = restored('[data-tv-work] img')
		.slice(0, 3)
		.concat(restored('[data-tv-lead] img').slice(0, 3));
	const total = priorityImgs.length; // may be 0 on an unexpected template — handled below
	let ready = 0;

	const setProgress = (p) => {
		if (fill) fill.style.setProperty('--pf-load', String(Math.max(0.06, Math.min(1, p))));
	};
	setProgress(total ? 0 : 1);

	const bump = () => {
		ready += 1;
		setProgress(total ? ready / total : 1);
	};
	priorityImgs.forEach((img) => {
		if (img.complete && img.naturalWidth) {
			if (img.decode) img.decode().then(bump, bump);
			else bump();
		} else {
			img.addEventListener('load', bump, { once: true });
			img.addEventListener('error', bump, { once: true });
		}
	});

	let done = false;
	const reveal = () => {
		if (done) return;
		done = true;
		setProgress(1);
		try {
			sessionStorage.setItem('pf-overture-seen', '1');
		} catch {
			/* ignore */
		}

		/* Put the field into its emergence state — the engine is already running behind the curtain (D-80) —
		   then on the next frames let it resolve into focus while the overture dissolves over it. Two rAFs so
		   the start state is committed before the animation class is toggled. */
		root.classList.add('is-emerging');
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				overture.classList.add('is-dismissed');
				root.classList.add('is-revealed'); // the chrome eases in after the world has arrived
			});
		});

		/* Clean-up: end the one-shot emergence, and take the dissolved overture out of the layout + a11y tree
		   (it is already aria-hidden, but `hidden` also stops it capturing pointer events over the coil). */
		window.setTimeout(() => root.classList.remove('is-emerging'), 1700);
		const retire = () => {
			overture.setAttribute('hidden', '');
			overture.removeEventListener('transitionend', onEnd);
		};
		const onEnd = (e) => {
			if (e.target === overture && e.propertyName === 'opacity') retire();
		};
		overture.addEventListener('transitionend', onEnd);
		window.setTimeout(retire, 1400); // fallback if transitionend is missed
	};

	/* Poll readiness against the min-show / max-wait envelope. rAF-timed, so it costs nothing measurable and
	   stops the instant the overture is dismissed. */
	const tick = () => {
		if (done) return;
		const elapsed = performance.now() - start;
		if ((ready >= total && elapsed >= MIN_SHOW) || elapsed >= MAX_WAIT) {
			reveal();
			return;
		}
		requestAnimationFrame(tick);
	};

	/* Wait for the display font too where the API exists: the overture and captions are set in Archivo, and
	   revealing before it loads flashes the fallback grotesque on the brand line. Best-effort — never blocks
	   past the readiness envelope. */
	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(() => {}).catch(() => {});
	}
	requestAnimationFrame(tick);
}
