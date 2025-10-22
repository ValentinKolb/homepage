import { sql } from "bun";

/**
 * Run database migrations for the collab sse api
 */
export async function migrate() {
  await sql`
    -- Create auth schema
    CREATE SCHEMA IF NOT EXISTS collab;

    -- Create pgcrypto extension needed for gen_random_uuid
    CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA collab;

    -- Tables
    CREATE TABLE IF NOT EXISTS collab.blob (
      id          VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid(),
      text_blob   TEXT NOT NULL
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS ix_id_lookup      ON collab.blob (id);
    `.simple();
}
