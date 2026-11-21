// Identity and access (#57). `user`, `session` and `verification` have the
// shapes Better Auth's core models expect (its Drizzle adapter maps them by
// these property names). `otp_rate_limit` is FOA's own: Better Auth limits
// only per IP and path, and FOA limits sign-in codes per email and per IP.
// Ids are UUIDv7 made in the app (src/server/ids.ts).
//
// Loads under plain Node (drizzle-kit, the seed script): relative imports
// only, no "server-only".

import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

export const user = pgTable("user", {
  id: uuid().primaryKey(),
  name: text().notNull(),
  /** Stored trimmed and lower-cased; one account per address. */
  email: text().notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text(),
  createdAt: timestamptz("created_at").notNull(),
  updatedAt: timestamptz("updated_at").notNull(),
});

export type User = typeof user.$inferSelect;

/** A signed-in device or browser. The cookie holds `token`, signed. */
export const session = pgTable(
  "session",
  {
    id: uuid().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: timestamptz("expires_at").notNull(),
    /** The IP and browser the session was started from, shown to its user. */
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamptz("created_at").notNull(),
    updatedAt: timestamptz("updated_at").notNull(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
);

/**
 * Better Auth requires this table. Sign-in by email code never writes to it:
 * it holds credentials for other ways to sign in (OAuth, passwords), which
 * FOA doesn't use. A passkey or authenticator (#60) adds its own tables.
 */
export const account = pgTable(
  "account",
  {
    id: uuid().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamptz("access_token_expires_at"),
    refreshTokenExpiresAt: timestamptz("refresh_token_expires_at"),
    scope: text(),
    password: text(),
    createdAt: timestamptz("created_at").notNull(),
    updatedAt: timestamptz("updated_at").notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)]
);

/** Better Auth's one-time values: here, hashed sign-in codes. */
export const verification = pgTable(
  "verification",
  {
    id: uuid().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamptz("expires_at").notNull(),
    createdAt: timestamptz("created_at").notNull(),
    updatedAt: timestamptz("updated_at").notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const otpRateLimitScope = pgEnum("otp_rate_limit_scope", [
  "email",
  "ip",
]);

/**
 * Sign-in codes requested per email address and per IP in a fixed window.
 * Keys are HMACs, never the address or IP itself.
 */
export const otpRateLimit = pgTable(
  "otp_rate_limit",
  {
    scope: otpRateLimitScope().notNull(),
    keyHash: text("key_hash").notNull(),
    windowStart: timestamptz("window_start").notNull(),
    count: integer().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.scope, table.keyHash, table.windowStart] }),
    index("otp_rate_limit_window_start_idx").on(table.windowStart),
  ]
);
