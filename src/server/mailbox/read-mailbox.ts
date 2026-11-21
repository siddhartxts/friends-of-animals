// Reading the capture mailbox over HTTP (GET /api/capture-mailbox). Outside
// production every sign-in code lands in the mailbox, and on staging (the
// public site) whoever reads it could sign in as anyone. So it is:
//   - absent in production (404), even with a token;
//   - closed unless CAPTURE_MAILBOX_TOKEN is set (404);
//   - only for the token holder (x-capture-mailbox-token, compared in
//     constant time; 401 otherwise);
//   - never cached, never indexed, never linked.

import { createHash, timingSafeEqual } from "node:crypto";

import type { AppDb } from "../db/app-db";
import { readCapturedEmail } from "../ports/email-capture";

export type MailboxRequest = {
  appEnv: "local" | "preview" | "staging" | "production";
  configuredToken: string | undefined;
  providedToken: string | null;
  to: string | null;
};

export type MailboxResponse =
  | {
      status: 200;
      body: { messages: { subject: string; text: string; sentAt: string }[] };
    }
  | { status: 400 | 401 | 404 };

/** Equal tokens, in time that doesn't depend on where they differ. */
function sameToken(provided: string, configured: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(provided), digest(configured));
}

export async function readMailbox(
  db: AppDb,
  { appEnv, configuredToken, providedToken, to }: MailboxRequest
): Promise<MailboxResponse> {
  if (appEnv === "production" || !configuredToken) return { status: 404 };
  if (!providedToken || !sameToken(providedToken, configuredToken)) {
    return { status: 401 };
  }
  if (!to) return { status: 400 };
  const messages = await readCapturedEmail(db, { to, limit: 5 });
  return {
    status: 200,
    body: {
      messages: messages.map(({ subject, text, sentAt }) => ({
        subject,
        text,
        sentAt: sentAt.toISOString(),
      })),
    },
  };
}
