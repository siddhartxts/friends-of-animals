import { type NextRequest, NextResponse } from "next/server";

import { competitionParams } from "@/app/competitions/_lib/view";
import { isStorySlug } from "@/content/stories";
import { getSampleCompetitions } from "@/content/sample";
import { isSignedInPath } from "@/lib/app-routes";
import { ROUTES } from "@/lib/routes";
import { hasSessionCookie } from "@/server/identity/session-cookie";

// Unlisted slugs render at request time, and the header's <Suspense> starts
// streaming before the page's notFound() runs, so they kept a 200 status
// (cacheComponents rules out dynamicParams = false). Rejecting them here,
// before rendering starts, gives a real 404.
const COMPETITION_SLUGS = new Set(
  competitionParams(getSampleCompetitions()).map((p) => p.slug)
);

// No route matches this path, so Next serves app/not-found.tsx with a 404.
const MISSING = "/__not-found";

export function proxy(request: NextRequest) {
  // Pages behind sign-in: a request without a session cookie goes straight
  // to sign in. With one, the page checks the session itself.
  if (isSignedInPath(request.nextUrl.pathname)) {
    return hasSessionCookie(request.headers)
      ? NextResponse.next()
      : NextResponse.redirect(new URL(ROUTES.signIn.path, request.url));
  }

  const [, section, raw = ""] = request.nextUrl.pathname.split("/");
  let slug: string;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    // A malformed escape can't be a real slug.
    slug = "";
  }
  const known =
    section === "blog" ? isStorySlug(slug) : COMPETITION_SLUGS.has(slug);
  if (known) return NextResponse.next();
  return NextResponse.rewrite(new URL(MISSING, request.url));
}

export const config = {
  matcher: [
    "/blog/:slug",
    "/competitions/:slug",
    "/account",
    "/account/:path*",
  ],
};
