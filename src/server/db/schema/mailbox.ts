// The capture mailbox (#57): outside production, every email (and, from
// #58, every SMS) is stored here instead of being sent, so staff and the
// Seam 2 journeys can read sign-in codes. The table exists in every
// environment's schema; production never writes to it.
//
// Loads under plain Node (drizzle-kit, the seed script): relative imports
// only, no "server-only".

import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const capturedMessageChannel = pgEnum("captured_message_channel", [
  "email",
  "sms",
]);

export const capturedMessage = pgTable(
  "captured_message",
  {
    id: uuid().primaryKey(),
    channel: capturedMessageChannel().notNull(),
    /** An email address (trimmed, lower-cased) or a phone number. */
    toAddress: text("to_address").notNull(),
    /** Emails only. */
    subject: text(),
    bodyText: text("body_text").notNull(),
    bodyHtml: text("body_html"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("captured_message_to_address_created_at_idx").on(
      table.toAddress,
      table.createdAt.desc()
    ),
  ]
);
