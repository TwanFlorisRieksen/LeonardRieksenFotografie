/*
 * legal.ts — the facts the legal layer is allowed to state, and nothing else (P11 / D-82).
 *
 * WHY A MODULE AND NOT PROSE IN THREE PAGES. A privacy statement, a cookie policy and a set of terms all
 * repeat the same handful of business facts. Written out per page they drift — which is exactly the failure
 * this project already had once (two e-mail addresses, one migrated and one current). Every identity fact
 * below is therefore imported from `schema.ts`, which is the site's existing single source for them, and
 * every legal-only value is declared here once and rendered from here everywhere.
 *
 * WHAT IS DELIBERATELY ABSENT (CLAUDE §4.6 / §9.2 — no invented business facts):
 *   · NO postal address. The business publishes none anywhere (the old site said only "Opdrachten op
 *     locatie"), so none is stated. This is a KNOWN LEGAL GAP for art. 3:15d BW — see TERMS_GAPS below.
 *   · NO VAT identification number. Never published on the old site, not derivable. Same gap.
 *   · NO legal-entity type (eenmanszaak / vof / b.v.). The KvK number is published; the rechtsvorm is not,
 *     and guessing it would be a claim about the business's legal structure.
 *   · NO functionaris gegevensbescherming. None is appointed and none is required under art. 37 AVG for a
 *     business of this nature; the privacy statement says exactly that rather than implying one exists.
 *   · NO telephone number. Removed sitewide by explicit owner instruction (D-76) and not reintroduced here.
 */

export { SITE_NAME, PERSON_NAME, CONTACT_EMAIL, KVK, SERVICE_AREA } from './schema';

/**
 * The Google Analytics 4 measurement ID. This is Leo's OWN, PRE-EXISTING property: the same ID was already
 * live on the old website (`reference/old-website/*.html`, loaded there unconditionally and without any
 * consent gate — which is precisely the defect this work corrects). It is not a secret: a measurement ID is
 * public by construction, visible in any page that loads the tag, and is not a credential (SEC-07 is about
 * secrets, and this is not one).
 */
export const GA_MEASUREMENT_ID = 'G-40JTTDBCHT';

/**
 * The GA4 property's configured data-retention setting, as ASSERTED by the privacy statement.
 *
 * THIS IS A CLAIM ABOUT A SETTING ONLY THE OWNER CAN MAKE, in the Google Analytics interface
 * (Admin → Data collection and modification → Data retention). It cannot be verified or changed from this
 * repository. The value here and the value in the GA property MUST match; if the owner chooses 14 months
 * instead, change this constant in the same act. See PROGRESS.md "owner prerequisites".
 */
export const GA_RETENTION_MONTHS = 2;

/**
 * DuPho's Algemene Voorwaarden. MIGRATED FACT, not an invention: the old website stated, in the footer of
 * every page, "Ik hanteer de algemene voorwaarden van DuPho" and linked to exactly this URL
 * (OLD_WEBSITE_CONTENT_INVENTORY, row "Terms"; blueprint 3.16 requires the reference to be preserved in
 * substance when the business really works under them). Verified live 2026-08-25; the terms published there
 * are the February-2022 version.
 */
export const DUPHO_TERMS_URL = 'https://www.dupho.nl/advies/algemene-voorwaarden';

/** The Dutch supervisory authority, where a visitor may lodge a complaint (art. 77 AVG). */
export const DPA_NAME = 'Autoriteit Persoonsgegevens';
export const DPA_URL = 'https://www.autoriteitpersoonsgegevens.nl/nl/zelf-doen/privacyrechten/klacht-indienen-bij-de-ap';

/**
 * Document version + date, shown at the foot of each legal page. One date for all three: they were written
 * as one coherent layer describing one implementation, and dating them separately would suggest a revision
 * history that did not happen. Bump BOTH when any of the three changes materially.
 */
export const LEGAL_VERSION = '1.0';
export const LEGAL_UPDATED_ISO = '2026-08-25';
export const LEGAL_UPDATED_NL = '25 augustus 2026';

/** localStorage key holding the visitor's own consent choice. Kept here so page prose and the runtime
 *  script can never describe different keys — the cookie policy names this string literally. */
export const CONSENT_STORAGE_KEY = 'lrf-consent';

/**
 * The processors/recipients the site actually has, established by auditing the implementation rather than
 * by listing plausible vendors (CLAUDE §4.6). Rendered as a table in the privacy statement.
 */
export const RECIPIENTS = [
	{
		name: 'Netlify, Inc.',
		country: 'Verenigde Staten (met servers en een CDN wereldwijd)',
		role: 'Hosting van de website en verwerking en opslag van de inzendingen van het contactformulier.',
		basis: 'Verwerker. Netlify’s Data Processing Addendum maakt deel uit van de gebruiksvoorwaarden.',
	},
	{
		name: 'Automattic Inc. (Akismet)',
		country: 'Verenigde Staten',
		role: 'Spamfilter. Netlify legt iedere formulierinzending standaard voor aan Akismet om te bepalen of het om spam gaat.',
		basis: 'Subverwerker van Netlify.',
	},
	{
		name: 'Google Ireland Limited / Google LLC',
		country: 'Ierland en de Verenigde Staten; gegevens uit de EU worden verzameld via servers in de EU',
		role: 'Google Analytics. Wordt uitsluitend geladen nadat u daarvoor toestemming heeft gegeven.',
		basis: 'Verwerker, op grond van de Google Ads Data Processing Terms die in Google Analytics zijn aanvaard.',
	},
	{
		name: 'Google (Gmail)',
		country: 'Ierland en de Verenigde Staten',
		role: 'Het e-mailadres hierboven is een Gmail-mailbox. E-mail die u stuurt of ontvangt, en formulierinzendingen die per e-mail worden doorgestuurd, komen daar binnen.',
		basis: 'Verwerker voor de mailbox van Leonard Rieksen Fotografie.',
	},
] as const;

/**
 * The legally required identity details that are NOT available and therefore NOT stated. Art. 3:15d BW
 * obliges an information-society service to publish, among other things, a geographic address and — where
 * the service is subject to VAT — a VAT identification number. Neither exists in any project source.
 *
 * This list is the honest record of that gap. It is deliberately NOT rendered on the site (a page that
 * announces its own missing legal data helps nobody); it is here so the next session, and the final
 * compliance audit, find it in code rather than only in a report. See PROGRESS.md.
 */
export const TERMS_GAPS = [
	'Vestigings-/correspondentieadres (art. 3:15d lid 1 sub b BW)',
	'Btw-identificatienummer, indien de onderneming btw-plichtig is (art. 3:15d lid 1 sub g BW)',
] as const;
