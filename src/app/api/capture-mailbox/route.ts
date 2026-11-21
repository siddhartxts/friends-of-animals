import { connection, type NextRequest } from "next/server";

import { env } from "@/env";
import { db } from "@/server/db";
import { readMailbox } from "@/server/mailbox/read-mailbox";

// The capture mailbox for the Seam 2 journeys: GET ?to=<address> with the
// x-capture-mailbox-token header. Rules in src/server/mailbox/read-mailbox.ts.

const headers = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(request: NextRequest) {
  // Wait for a real request, so `next build` never prerenders this.
  await connection();
  const config = env();
  const result = await readMailbox(db, {
    appEnv: config.APP_ENV,
    configuredToken: config.CAPTURE_MAILBOX_TOKEN,
    providedToken: request.headers.get("x-capture-mailbox-token"),
    to: request.nextUrl.searchParams.get("to"),
  });
  return result.status === 200
    ? Response.json(result.body, { headers })
    : new Response(null, { status: result.status, headers });
}
