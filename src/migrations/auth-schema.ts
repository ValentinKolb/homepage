import { sql } from "bun";

/**
 * Run database migrations
 */
export async function migrate() {
  // Create permission enum (if not exists)
  await sql`
    -- Create auth schema
    CREATE SCHEMA IF NOT EXISTS auth;

    -- Permission enum
    DO $$ BEGIN
      CREATE TYPE auth.permission AS ENUM ('read', 'use', 'manage', 'admin');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    -- Users table
    CREATE TABLE IF NOT EXISTS auth.users (
      id         TEXT PRIMARY KEY,
      username   TEXT NOT NULL CHECK (username = TRIM(username)),
      public_key TEXT NOT NULL,
      img_data   TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON auth.users(username);
    CREATE INDEX IF NOT EXISTS idx_users_id_lower ON auth.users(LOWER(id));

    -- TOTP table
    CREATE TABLE IF NOT EXISTS auth.totp (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id          TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      label            TEXT NOT NULL,
      encrypted_secret TEXT NOT NULL,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_totp_user_id ON auth.totp(user_id);

    -- Policies table
    CREATE TABLE IF NOT EXISTS auth.policies (
      user_id      TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      scope        TEXT NOT NULL,
      level        auth.permission NOT NULL,
      payload      TEXT DEFAULT NULL,
      granted_by   TEXT REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, scope)
    );

    CREATE INDEX IF NOT EXISTS idx_policies_lookup ON auth.policies(user_id, scope);
    CREATE INDEX IF NOT EXISTS idx_policies_user_id ON auth.policies(user_id);
    CREATE INDEX IF NOT EXISTS idx_policies_scope ON auth.policies(scope);
  `.simple();
}
