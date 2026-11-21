// Drizzle schema barrel. One file per module next to this one, re-exported
// here with one `export *` line each; drizzle.config.ts, the app's `db`
// client and the test harness all read the schema from this file.
//
// Never import "server-only" here or in any schema file: drizzle-kit loads
// the schema under plain Node, where that import throws.
export * from "./identity";
export * from "./mailbox";
