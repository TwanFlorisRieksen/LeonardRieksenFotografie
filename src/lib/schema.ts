/*
 * schema.ts — the site's structured-data architecture (SEO-09 / blueprint 10.x, P9 / D-80).
 *
 * ONE GRAPH, NOT SCATTERED SNIPPETS. Every page emits a single `@graph` whose nodes are joined by stable
 * `@id`s, so the Organization, the Person and the WebSite are declared once and REFERENCED everywhere else.
 * That is what stops the same entity being described three different ways on three different routes, which
 * is the usual failure mode of per-page JSON-LD.
 *
 * ONLY WHAT IS ACTUALLY TRUE, AND ACTUALLY ON THE PAGE. Every value below is a fact already published in
 * the visible site and traceable to the old-site inventory or an explicit owner instruction: the business
 * name, Leo's name, the e-mail address, the KvK number, the service region, the two disciplines and the
 * confirmed social profiles.
 * Nothing is invented, and several tempting types are DELIBERATELY ABSENT (CLAUDE §13.3, blueprint 10.x):
 *
 *   · NO LocalBusiness / ProfessionalService. Both are meaningful only with a real postal address, and
 *     this business publishes none. Declaring one with a region in place of an address would be a claim
 *     the site cannot support.
 *   · NO AggregateRating, Review, award, client list or other claims. None are published.
 *
 * If any of those facts later becomes real and visible, this is the one file that changes.
 */

import { SOCIAL_LINKS } from './social';

export const SITE_NAME = 'Leonard Rieksen Fotografie';
export const PERSON_NAME = 'Leo Rieksen';
/** Published on /contact/ — the only contact route the site offers (the phone number was removed in D-76). */
export const CONTACT_EMAIL = 'LeonardRFotografie@gmail.com';
/** Chamber-of-Commerce number, published on /contact/. Migrated factual data, not invented. */
export const KVK = '32169926';
/** The region Leo actually works in, as the site states it. Not a location page, not a keyword. */
export const SERVICE_AREA = 'Midden-Nederland';

type Node = Record<string, unknown>;

const abs = (site: URL, path: string) => new URL(path, site).toString();

/**
 * The three entities that are true on every route. Emitted once per page and referenced by `@id` from the
 * page-specific nodes, so a crawler resolves one business, one photographer and one website across the
 * whole site rather than nineteen near-duplicates.
 */
function baseNodes(site: URL): Node[] {
	const org = abs(site, '/#organization');
	const person = abs(site, '/#leo');
	const website = abs(site, '/#website');
	return [
		{
			'@type': 'Organization',
			'@id': org,
			name: SITE_NAME,
			url: abs(site, '/'),
			logo: {
				'@type': 'ImageObject',
				url: abs(site, '/brand/lrf-logo.png'),
				width: 600,
				height: 238,
			},
			email: CONTACT_EMAIL,
			description:
				'Architectuur- en interieurfotografie door Leo Rieksen, gebouwen en ruimtes vastgelegd met aandacht voor licht, lijn en materiaal.',
			areaServed: { '@type': 'AdministrativeArea', name: SERVICE_AREA },
			identifier: { '@type': 'PropertyValue', name: 'KvK', value: KVK },
			sameAs: SOCIAL_LINKS.map(({ href }) => href),
			founder: { '@id': person },
			knowsAbout: ['Architectuurfotografie', 'Interieurfotografie'],
		},
		{
			'@type': 'Person',
			'@id': person,
			name: PERSON_NAME,
			jobTitle: 'Fotograaf',
			worksFor: { '@id': org },
			url: abs(site, '/over-mij/'),
		},
		{
			'@type': 'WebSite',
			'@id': website,
			url: abs(site, '/'),
			name: SITE_NAME,
			inLanguage: 'nl-NL',
			publisher: { '@id': org },
		},
	];
}

export interface PageSchemaInput {
	site: URL;
	canonical: URL;
	title: string;
	description: string;
	/** Absolute URL of the page's representative photograph, when it has one. */
	image?: string;
	/** Visible ancestor trail, in order, excluding the page itself. Only pass it when the page really shows it. */
	breadcrumb?: { name: string; path: string }[];
	/** Extra page-type nodes (a Service, an ImageObject, a CollectionPage…). Joined into the same graph. */
	extra?: Node[];
}

/**
 * Builds the complete graph for one page. `WebPage` is the page itself; it is tied to the WebSite and, when
 * the page has a representative photograph, to that image — which is how a photography site tells a crawler
 * which picture belongs to which page without repeating the whole gallery.
 */
export function pageSchema({
	site,
	canonical,
	title,
	description,
	image,
	breadcrumb,
	extra = [],
}: PageSchemaInput): string {
	const org = abs(site, '/#organization');
	const website = abs(site, '/#website');
	const pageId = `${canonical.toString()}#webpage`;

	const page: Node = {
		'@type': 'WebPage',
		'@id': pageId,
		url: canonical.toString(),
		name: title,
		description,
		inLanguage: 'nl-NL',
		isPartOf: { '@id': website },
		about: { '@id': org },
	};
	if (image) page.primaryImageOfPage = { '@type': 'ImageObject', url: image };

	const nodes: Node[] = [...baseNodes(site), page];

	if (breadcrumb && breadcrumb.length) {
		nodes.push({
			'@type': 'BreadcrumbList',
			'@id': `${canonical.toString()}#breadcrumb`,
			itemListElement: [
				...breadcrumb.map((b, i) => ({
					'@type': 'ListItem',
					position: i + 1,
					name: b.name,
					item: abs(site, b.path),
				})),
				{ '@type': 'ListItem', position: breadcrumb.length + 1, name: title },
			],
		});
		page.breadcrumb = { '@id': `${canonical.toString()}#breadcrumb` };
	}

	nodes.push(...extra);
	return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
}

/** A service the site actually sells, described exactly as its own page describes it. */
export function serviceNode(site: URL, canonical: URL, name: string, description: string): Node {
	return {
		'@type': 'Service',
		'@id': `${canonical.toString()}#service`,
		name,
		description,
		serviceType: name,
		provider: { '@id': abs(site, '/#organization') },
		areaServed: { '@type': 'AdministrativeArea', name: SERVICE_AREA },
	};
}

/**
 * A photograph, described from the data the page already renders: its own alt text as the caption, Leo as
 * creator and copyright holder. This is the image SEO the blueprint asks for — factual, per-photograph, and
 * generated from the content model rather than written by hand (so it cannot drift from what is displayed).
 */
export function imageNode(site: URL, url: string, caption: string, width?: number, height?: number): Node {
	const node: Node = {
		'@type': 'ImageObject',
		'@id': url,
		contentUrl: url,
		url,
		caption,
		creator: { '@id': abs(site, '/#leo') },
		copyrightHolder: { '@id': abs(site, '/#organization') },
		creditText: SITE_NAME,
	};
	if (width) node.width = width;
	if (height) node.height = height;
	return node;
}
