/*
 * consent.js — consent state, and the only place Google Analytics is ever allowed to start (P11 / D-82).
 *
 * ─── THE RULE THIS FILE ENFORCES ─────────────────────────────────────────────────────────────────────
 * Nothing belonging to Google is fetched, executed or stored until `analytics === true` has been written
 * by an affirmative click. There is no "load it but don't use it", no cookieless ping, no pre-connect and
 * no preload: art. 11.7a Tw governs the ACCESS to the device, not what is done afterwards, so the request
 * itself has to wait. This is Google's BASIC consent mode ("Google tags blocked until consent is
 * granted") rather than Advanced, chosen because Advanced exists to keep measuring people who said no.
 *
 * ─── WHY localStorage AND NOT A COOKIE ────────────────────────────────────────────────────────────────
 * The stored value is the visitor's own decision. Keeping it needs no consent — it is strictly necessary
 * to honour the choice — but a cookie would be sent to the server on every single request for no reason.
 * localStorage keeps it on the device where it belongs. It holds no identifier and nothing personal: a
 * schema version, a boolean, and the moment the choice was made (which is the record art. 7(1) AVG asks a
 * controller to be able to demonstrate).
 *
 * ─── WITHDRAWAL ──────────────────────────────────────────────────────────────────────────────────────
 * `set(false)` writes the new state, tells an already-loaded gtag to deny `analytics_storage`, and deletes
 * the `_ga*` cookies from every domain scope they could have been written on. A tag that is already in the
 * page cannot be un-executed — that is a property of the browser, not a shortcoming here — so the honest
 * claim, and the one the privacy statement makes, is: no further analytics data is collected, and the
 * identifiers are removed. A reload leaves nothing of Google behind at all.
 */

/** Schema version of the stored record. Bump only if the shape changes; an unknown version is discarded. */
const SCHEMA = 1;

/** Resolved from the DOM so the measurement ID lives in exactly one place (src/lib/legal.ts). */
let root = null;
let gaId = '';
let storeKey = 'lrf-consent';

/** True once gtag.js has been injected in this document. A page load can only ever do this once. */
let tagLoaded = false;

/**
 * Reads the stored decision.
 * @returns {{analytics: boolean, ts: string} | null} null when the visitor has not decided yet.
 */
export function getConsent() {
	let raw;
	try {
		raw = window.localStorage.getItem(storeKey);
	} catch {
		// Private mode, disabled storage, or a blocked origin. No stored decision means no analytics —
		// the safe direction — and the banner simply asks again. Never throw over this.
		return null;
	}
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		if (!parsed || parsed.v !== SCHEMA || typeof parsed.analytics !== 'boolean') return null;
		return { analytics: parsed.analytics, ts: typeof parsed.ts === 'string' ? parsed.ts : '' };
	} catch {
		return null;
	}
}

function write(analytics) {
	const record = { v: SCHEMA, analytics, ts: new Date().toISOString() };
	try {
		window.localStorage.setItem(storeKey, JSON.stringify(record));
	} catch {
		/* Storage refused. The choice still applies to this page view; it just cannot be remembered. */
	}
	return record;
}

/** Removes the analytics identifiers from every domain scope gtag could have written them on. */
function clearAnalyticsCookies() {
	const host = window.location.hostname;
	const scopes = ['', host, '.' + host];
	const labels = host.split('.');
	// A registrable-domain guess for the common two-label case (example.nl → .example.nl). Deleting a
	// cookie that does not exist is a no-op, so an extra scope costs nothing and a missed one leaves an
	// identifier behind — which is the failure that matters.
	if (labels.length > 2) scopes.push('.' + labels.slice(-2).join('.'));

	const names = document.cookie
		.split(';')
		.map((pair) => pair.split('=')[0].trim())
		.filter((name) => name === '_ga' || name.indexOf('_ga_') === 0 || name === '_gid' || name.indexOf('_gat') === 0);

	for (const name of names) {
		for (const scope of scopes) {
			document.cookie = name + '=; Max-Age=0; path=/' + (scope ? '; domain=' + scope : '');
		}
	}
}

function gtag() {
	// eslint-disable-next-line prefer-rest-params
	window.dataLayer.push(arguments);
}

/**
 * Loads and configures GA4. Only ever called from `applyConsent(true)`.
 *
 * The order below is the documented one and it matters: the consent defaults are queued on `dataLayer`
 * BEFORE the library arrives, so the library's first act is to read a state in which everything is denied,
 * and only `analytics_storage` is then granted. `ad_storage`, `ad_user_data` and `ad_personalization` are
 * never granted by anything in this codebase — the site has no advertising and asks for none.
 */
function loadAnalytics() {
	if (tagLoaded || !gaId) return;
	tagLoaded = true;

	window.dataLayer = window.dataLayer || [];
	window.gtag = gtag;

	gtag('consent', 'default', {
		ad_storage: 'denied',
		ad_user_data: 'denied',
		ad_personalization: 'denied',
		analytics_storage: 'denied',
	});
	gtag('consent', 'update', { analytics_storage: 'granted' });
	gtag('js', new Date());
	/*
	 * `allow_google_signals: false` switches off Google Signals — cross-device measurement built from
	 * signed-in Google accounts, plus demographics and interests reporting. `allow_ad_personalization_signals:
	 * false` stops the events being usable for ads personalisation. Both are documented gtag settings and
	 * both are off because this site advertises nothing and profiles nobody. No custom events, no user_id,
	 * no user properties, no custom dimensions are configured anywhere: the only thing measured is the
	 * automatic page_view, which is what "which pages are read" actually needs.
	 */
	gtag('config', gaId, {
		allow_google_signals: false,
		allow_ad_personalization_signals: false,
	});

	const script = document.createElement('script');
	script.async = true;
	script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
	document.head.appendChild(script);
}

function applyConsent(analytics) {
	if (analytics) {
		loadAnalytics();
		return;
	}
	if (tagLoaded && typeof window.gtag === 'function') {
		window.gtag('consent', 'update', { analytics_storage: 'denied' });
	}
	clearAnalyticsCookies();
}

/**
 * Records a decision and acts on it. This is the single entry point for the banner, the preference panel
 * on /cookies/, and anything added later.
 * @param {boolean} analytics
 */
export function setConsent(analytics) {
	const record = write(analytics);
	applyConsent(analytics);
	if (root) root.querySelectorAll('[data-consent-banner]').forEach((el) => el.setAttribute('hidden', ''));
	measureBar();
	document.dispatchEvent(new CustomEvent('lrf:consent', { detail: record }));
}

/**
 * Boots the layer. Called once per page from ConsentBanner.astro.
 *
 * Deliberately does NOT move focus when the banner appears. Stealing focus on load would interrupt a
 * screen-reader user mid-sentence and drop a keyboard user out of wherever they were; the banner is early
 * in the DOM instead, which puts it near the start of the reading and tab order without taking control.
 */
/*
 * HOW MUCH OF THE BOTTOM EDGE THE BAR IS OCCUPYING (P12 / D-84).
 *
 * The banner is `position: fixed; bottom: 0` at `--z-overlay`. The site's two bottom-anchored controls —
 * "terug naar boven" and, on the portfolio, the wayfinding marker — are fixed to the same edge at
 * `--z-sticky`, one layer below. So for as long as a first-time visitor has not chosen, both of them sat
 * UNDER the bar: invisible, and unclickable. Found in the browser, not in review — Playwright reported
 * `.consent__inner … intercepts pointer events` on a plain click of the back-to-top disc.
 *
 * `--consent-h` publishes the bar's real height on <html> so those controls can sit clear of it instead of
 * being hidden or fighting it for a layer. It is 0 whenever the bar is not up, which is every page view
 * after the visitor has decided once, so nothing about the resting layout changes. The bar's height is a
 * function of the viewport width (the copy rewraps), hence the ResizeObserver rather than a constant.
 */
function measureBar() {
	const bar = root && root.querySelector('[data-consent-banner]');
	const h = bar && !bar.hasAttribute('hidden') ? Math.round(bar.getBoundingClientRect().height) : 0;
	document.documentElement.style.setProperty('--consent-h', h ? `${h}px` : '0px');
}

export function initConsent() {
	root = document.getElementById('lrf-consent');
	if (!root) return;
	gaId = root.dataset.gaId || '';
	storeKey = root.dataset.storeKey || storeKey;

	const stored = getConsent();
	if (stored) {
		// A returning visitor: honour the decision silently. No banner, no re-asking.
		applyConsent(stored.analytics);
	} else {
		root.querySelectorAll('[data-consent-banner]').forEach((el) => el.removeAttribute('hidden'));
		measureBar();
		const bar = root.querySelector('[data-consent-banner]');
		if (bar && 'ResizeObserver' in window) new ResizeObserver(measureBar).observe(bar);
	}

	root.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		if (target.closest('[data-consent-accept]')) setConsent(true);
		else if (target.closest('[data-consent-decline]')) setConsent(false);
	});
}
