// The email port. Use cases send through it and never pick a provider.
// Adapters:
//   - capture (src/server/ports/email-capture.ts): stores each message in the
//     capture mailbox; every environment except production.
//   - the in-memory fake (src/test/fakes/email.ts): Seam 1 tests.
//   - SES in ap-south-1: production. Deferred until FOA's SES account exists;
//     until then production gets `unconfiguredEmailSender`.
// Every adapter passes ./email.contract.ts.

/** One email. `text` is required; `html` is an optional alternative. */
export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string | undefined;
};

/** A message as a mailbox holds it: address normalised, time sent. */
export type ReceivedEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string | undefined;
  sentAt: Date;
};

export interface EmailSender {
  /** Sends one message. Rejects if the provider refuses it. */
  send(message: EmailMessage): Promise<void>;
}

/**
 * How mailboxes compare and store addresses: trimmed and lower-cased, so
 * "Asha@Example.test" and "asha@example.test" are one recipient.
 */
export function normaliseEmailAddress(address: string): string {
  return address.trim().toLowerCase();
}

/** Thrown in production while no real email provider is configured. */
export class EmailNotConfiguredError extends Error {
  constructor() {
    super(
      "No email provider is configured for production. The SES adapter " +
        "arrives once FOA's SES account exists; codes are never captured " +
        "in production."
    );
    this.name = "EmailNotConfiguredError";
  }
}

/** Production's sender until SES is wired: refuses every message. */
export const unconfiguredEmailSender: EmailSender = {
  send: () => Promise.reject(new EmailNotConfiguredError()),
};
