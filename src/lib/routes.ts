/**
 * The one registry of public routes. The header, footer and sitemap read it,
 * so a page that isn't here isn't linked. Labels live in messages/en-IN/nav.json
 * under nav.links.<id>. Spec modules that aren't built yet (gallery,
 * transparency, events, volunteer, adopt, NGOs, auctions) stay out. Pages
 * behind sign-in are in src/lib/app-routes.ts.
 */

/** Section colour each page leans on. */
export type SectionHue =
  | "multi"
  | "red"
  | "green"
  | "blue"
  | "yellow"
  | "teal"
  | "pink"
  | "neutral";

export type FooterGroup = "takePart" | "organisation" | "policies";

type RouteDef = {
  path: `/${string}`;
  hue: SectionHue;
  /** Order in the header's main navigation. */
  primaryNav?: number;
  footer?: FooterGroup;
  /** In sitemap.xml, with this fixed last-modified date (no clock at build). */
  sitemap?: { updated: string; priority: number };
  /** Hidden from navigation and the sitemap; not served in production. */
  nonProduction?: true;
};

const UPDATED = "2026-11-18";

const DEFINITIONS = {
  home: { path: "/", hue: "multi", sitemap: { updated: UPDATED, priority: 1 } },
  competitions: {
    path: "/competitions",
    hue: "pink",
    primaryNav: 1,
    footer: "takePart",
    sitemap: { updated: UPDATED, priority: 0.9 },
  },
  competition: { path: "/competitions/[slug]", hue: "pink" },
  schools: {
    path: "/schools",
    hue: "green",
    primaryNav: 2,
    footer: "takePart",
    sitemap: { updated: UPDATED, priority: 0.8 },
  },
  awareness: {
    path: "/awareness",
    hue: "teal",
    primaryNav: 3,
    footer: "takePart",
    sitemap: { updated: UPDATED, priority: 0.8 },
  },
  stories: {
    path: "/blog",
    hue: "yellow",
    primaryNav: 4,
    footer: "takePart",
    sitemap: { updated: UPDATED, priority: 0.7 },
  },
  story: { path: "/blog/[slug]", hue: "yellow" },
  about: {
    path: "/about",
    hue: "blue",
    primaryNav: 5,
    footer: "organisation",
    sitemap: { updated: UPDATED, priority: 0.8 },
  },
  impact: {
    path: "/impact",
    hue: "teal",
    footer: "organisation",
    sitemap: { updated: UPDATED, priority: 0.5 },
  },
  donate: {
    path: "/donate",
    hue: "red",
    footer: "organisation",
    sitemap: { updated: UPDATED, priority: 0.7 },
  },
  contact: {
    path: "/contact",
    hue: "neutral",
    footer: "organisation",
    sitemap: { updated: UPDATED, priority: 0.6 },
  },
  credits: {
    path: "/credits",
    hue: "neutral",
    footer: "organisation",
    sitemap: { updated: UPDATED, priority: 0.2 },
  },
  privacy: {
    path: "/privacy",
    hue: "neutral",
    footer: "policies",
    sitemap: { updated: UPDATED, priority: 0.3 },
  },
  terms: {
    path: "/terms",
    hue: "neutral",
    footer: "policies",
    sitemap: { updated: UPDATED, priority: 0.3 },
  },
  safeguarding: {
    path: "/safeguarding",
    hue: "neutral",
    footer: "policies",
    sitemap: { updated: UPDATED, priority: 0.5 },
  },
  childProtection: {
    path: "/child-protection-policy",
    hue: "neutral",
    footer: "policies",
    sitemap: { updated: UPDATED, priority: 0.4 },
  },
  pricing: {
    path: "/pricing",
    hue: "neutral",
    footer: "policies",
    sitemap: { updated: UPDATED, priority: 0.3 },
  },
  refunds: {
    path: "/refunds",
    hue: "neutral",
    footer: "policies",
    sitemap: { updated: UPDATED, priority: 0.3 },
  },
  styleguide: { path: "/styleguide", hue: "multi", nonProduction: true },
  signUp: { path: "/sign-up", hue: "blue" },
  signIn: { path: "/sign-in", hue: "blue", footer: "takePart" },
} as const satisfies Record<string, RouteDef>;

export type RouteId = keyof typeof DEFINITIONS;
export type PublicRoute = RouteDef & { id: RouteId };

export const ROUTES = Object.fromEntries(
  Object.entries(DEFINITIONS).map(([id, def]) => [id, { id, ...def }])
) as { [K in RouteId]: (typeof DEFINITIONS)[K] & { id: K } };

const list: PublicRoute[] = Object.values(ROUTES);

/** Header links, in order. Donate is a separate button. */
export const PRIMARY_NAV: PublicRoute[] = list
  .filter((r) => r.primaryNav !== undefined)
  .toSorted((a, b) => (a.primaryNav ?? 0) - (b.primaryNav ?? 0));

export const FOOTER_GROUPS: readonly FooterGroup[] = [
  "takePart",
  "organisation",
  "policies",
];

export function footerRoutes(group: FooterGroup): PublicRoute[] {
  return list.filter((r) => r.footer === group);
}

export function sitemapRoutes(): (PublicRoute & {
  updated: string;
  priority: number;
})[] {
  return list.flatMap((r) =>
    r.sitemap && !r.nonProduction ? [{ ...r, ...r.sitemap }] : []
  );
}

/** Concrete href for a dynamic route, e.g. routeHref("story", "kolam"). */
export function slugHref(id: "competition" | "story", slug: string): string {
  return ROUTES[id].path.replace("[slug]", encodeURIComponent(slug));
}
