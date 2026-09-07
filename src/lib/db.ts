import "server-only";

import { getDatabase, MissingDatabaseConnectionError } from "@netlify/database";

/**
 * Server-only database access (Netlify Database — a managed Postgres).
 * The browser never talks to the database: participants and the facilitator
 * both go through the route handlers in src/app/api.
 * On Netlify the connection is configured automatically (NETLIFY_DB_URL).
 * For local development, put a Postgres URL in DATABASE_URL and apply
 * netlify/database/migrations/001_init/migration.sql once.
 */

let instance: ReturnType<typeof getDatabase> | null = null;

export function db() {
  if (!instance) {
    instance = getDatabase(
      process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : undefined,
    );
  }
  return instance;
}

/** True when a database connection can be established in this environment. */
export function isDbConfigured(): boolean {
  try {
    db();
    return true;
  } catch (e) {
    if (e instanceof MissingDatabaseConnectionError) return false;
    return true;
  }
}
