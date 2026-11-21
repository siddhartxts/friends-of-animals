import type { DbWithClock } from "../db/app-db";

/** What seeders and builders write with. */
export type SeedDeps = DbWithClock;

/** Seeds one module's preview data. Must be safe to run again. */
export type Seeder = (deps: SeedDeps) => Promise<void>;
