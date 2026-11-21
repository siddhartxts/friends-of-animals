import type { Clock } from "@/server/ports/clock";
import {
  normaliseEmailAddress,
  type EmailMessage,
  type EmailSender,
  type ReceivedEmail,
} from "@/server/ports/email";

/**
 * In-memory email for Seam 1 tests. It passes the same contract as the
 * capture adapter (src/server/ports/email.contract.ts) and adds what tests
 * need to look inside: everything sent, the last message to an address,
 * and failures on demand.
 */
export class FakeEmail implements EmailSender {
  readonly #clock: Clock;
  readonly #sent: ReceivedEmail[] = [];
  #failures: Error[] = [];

  constructor(clock: Clock) {
    this.#clock = clock;
  }

  async send(message: EmailMessage): Promise<void> {
    const failure = this.#failures.shift();
    if (failure) throw failure;
    this.#sent.push({
      to: normaliseEmailAddress(message.to),
      subject: message.subject,
      text: message.text,
      ...(message.html === undefined ? {} : { html: message.html }),
      sentAt: this.#clock.now(),
    });
  }

  /** Every message delivered so far, oldest first. */
  get sent(): readonly ReceivedEmail[] {
    return this.#sent;
  }

  /** One recipient's messages, newest first, as a mailbox lists them. */
  inbox(to: string): ReceivedEmail[] {
    const address = normaliseEmailAddress(to);
    return this.#sent.filter((message) => message.to === address).reverse();
  }

  /** The newest message to `to`, if any. */
  lastTo(to: string): ReceivedEmail | undefined {
    return this.inbox(to)[0];
  }

  /** Makes the next `count` sends reject with `error`; nothing is stored. */
  failNext(count: number, error = new Error("FakeEmail: send failed")): void {
    this.#failures = Array.from({ length: count }, () => error);
  }
}
