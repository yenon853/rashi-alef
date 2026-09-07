import "server-only";

import { getDatabase } from "@netlify/database";

/**
 * Server-only database access (Netlify Database — a managed Postgres).
 * The browser never talks to the database: participants and the facilitator
 * both go through the route handlers in src/app/api.
 * The connection string is injected automatically by Netlify (NETLIFY_DATABASE_URL).
 * For local development, put a Postgres URL in DATABASE_URL and apply
 * netlify/database/migrations/001_init/migration.sql once.
 */

let instance: ReturnType<typeof getDatabase> | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL);
}

export function db() {
  if (!instance) {
    instance = getDatabase(
      process.env.NETLIFY_DATABASE_URL ? undefined : { connectionString: process.env.DATABASE_URL },
    );
  }
  return instance;
}
