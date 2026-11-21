import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import type { Clock } from "../ports/clock";
import type * as schema from "./schema";

/**
 * The database type use cases, adapters and seed builders accept. Both the
 * app's postgres-js client (`Db`) and the tests' PGlite client (`TestDb`)
 * fit it, and so does a transaction from either.
 *
 * `execute()` results differ between the two drivers (an array against
 * `{ rows }`), so use the query builder rather than indexing them.
 */
export type AppDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * A database and the clock that stamps what is written to it: what adapters
 * and seed builders that write rows take. `Deps` adds the provider ports.
 */
export type DbWithClock = { db: AppDb; clock: Clock };
