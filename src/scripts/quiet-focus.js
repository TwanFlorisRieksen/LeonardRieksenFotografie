/*
 * QUIET FOCUS — move focus without painting a focus ring at a pointer visitor (P12 / D-84).
 *
 * THE PROBLEM, precisely. Two controls on this site move focus programmatically for good accessibility
 * reasons: BackToTop sends focus to the wordmark after the jump (otherwise a keyboard visitor's focus is
 * left 8000px below their own screen), and the near plane returns focus to the photograph it was opened
 * from (otherwise closing strands them at <body>). Both are correct. But `element.focus()` does not carry
 * the visitor's input modality with it: Chromium decides `:focus-visible` from the FOCUS TYPE, and a
 * script-driven focus on a link is treated as one that should show the indicator. MEASURED in the browser:
 * after a MOUSE click on the back-to-top disc, `.wordmark:focus-visible` matched and the global 2px blue
 * ring was painted around the logo — the owner's report, exactly, and the same mechanism paints a ring
 * around a photograph after a mouse-closed lightbox.
 *
 * WHY NOT THE OBVIOUS FIXES.
 *   · `outline: none` anywhere near these elements removes the indicator for KEYBOARD users too, which is
 *     a WCAG 2.4.7 failure. Non-negotiable.
 *   · "don't move focus for pointer users" loses the reason the focus move exists — and on the lightbox it
 *     would leave `document.activeElement` on a hidden dialog, so the next Tab restarts at the top of the
 *     document instead of at the photograph the visitor was just looking at.
 *
 * WHAT THIS DOES. It focuses the element and marks it `data-focus-quiet` for the duration of THAT focus
 * only. One CSS rule in base.css suppresses the ring while the attribute is present. The attribute is
 * removed on the element's own blur and on the very next keydown anywhere — so the instant a visitor
 * reaches for the keyboard, the site is fully indicated again, including on this element if it still has
 * focus. Nothing is disabled, nothing is global, and nothing survives one interaction.
 *
 * @param {HTMLElement | null | undefined} el
 * @param {boolean} quiet  false → an ordinary focus() with the normal indicator (keyboard-initiated)
 */
export function focusWithoutRing(el, quiet = true) {
	if (!el) return;
	if (!quiet) {
		el.focus({ preventScroll: true });
		return;
	}
	el.setAttribute('data-focus-quiet', '');
	el.focus({ preventScroll: true });
	const clear = () => {
		el.removeAttribute('data-focus-quiet');
		el.removeEventListener('blur', clear);
		window.removeEventListener('keydown', clear, true);
	};
	el.addEventListener('blur', clear);
	window.addEventListener('keydown', clear, true);
}

/**
 * Was this activation a keyboard one? A click synthesised by Enter/Space on a button or link reports
 * `detail === 0`; a real pointer click reports 1 or more. This is the standard discriminator and it needs
 * no modality tracking of its own.
 * @param {Event} e
 */
export const isKeyboardActivation = (e) =>
	typeof (/** @type {MouseEvent} */ (e).detail) === 'number' && /** @type {MouseEvent} */ (e).detail === 0;
