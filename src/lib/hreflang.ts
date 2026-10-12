/**
 * Hreflang language groups — single source of truth.
 *
 * Each group lists the canonical URL of every language version of ONE page.
 * BaseLayout looks up the page's canonical URL here and emits
 * <link rel="alternate" hreflang> for every member (incl. itself) plus
 * x-default, so every group is reciprocal by construction.
 *
 * URLs must match the page's `canonicalUrl` exactly (no trailing slash —
 * wrangler `html_handling = "drop-trailing-slash"`; the homepage is the bare
 * origin with "/"). A page that has no other-language counterpart stays out
 * of this file and gets no hreflang.
 */
const ORIGIN = 'https://ballaconsulting.com';

interface HreflangGroup {
  /** hreflang code → absolute canonical URL */
  versions: Record<string, string>;
  /** Language whose URL is used as x-default (the international/English one). */
  xDefault: string;
}

export const HREFLANG_GROUPS: HreflangGroup[] = [
  {
    versions: { en: `${ORIGIN}/`, nl: `${ORIGIN}/nl`, hu: `${ORIGIN}/hu` },
    xDefault: 'en',
  },
  {
    versions: { en: `${ORIGIN}/guide`, nl: `${ORIGIN}/guide-nl` },
    xDefault: 'en',
  },
  {
    versions: { en: `${ORIGIN}/privacy`, nl: `${ORIGIN}/privacy-nl` },
    xDefault: 'en',
  },
  {
    versions: { en: `${ORIGIN}/deals`, nl: `${ORIGIN}/nl/deals` },
    xDefault: 'en',
  },
];

export interface Alternate {
  hreflang: string;
  href: string;
}

/** Alternates for a canonical URL, or [] if the page has no language group. */
export function hreflangFor(canonical: string | undefined): Alternate[] {
  if (!canonical) return [];
  const group = HREFLANG_GROUPS.find((g) => Object.values(g.versions).includes(canonical));
  if (!group) return [];
  return [
    ...Object.entries(group.versions).map(([hreflang, href]) => ({ hreflang, href })),
    { hreflang: 'x-default', href: group.versions[group.xDefault] },
  ];
}
