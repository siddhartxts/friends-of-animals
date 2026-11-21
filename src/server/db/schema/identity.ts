// Identity and access (#57). The `user` table has the shape Better Auth's
// core user model expects (name, email, emailVerified, image, createdAt,
// updatedAt), so its Drizzle adapter can use it as is. Ids are UUIDv7 made
// in the app (src/server/ids.ts); times come from the injected clock.
//
// Loads under plain Node (drizzle-kit, the seed script): relative imports
// only, no "server-only".

import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: uuid().primaryKey(),
  name: text().notNull(),
  /** Stored trimmed and lower-cased; one account per address. */
  email: text().notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type User = typeof user.$inferSelect;
