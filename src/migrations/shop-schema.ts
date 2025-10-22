import { sql } from "bun";

/**
 * Run database migrations for the shop system
 */
export async function migrate() {
  await sql`
    -- Create auth schema
    CREATE SCHEMA IF NOT EXISTS shop;

    -- Create pgcrypto extension needed for gen_random_uuid
    CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA shop;

    -- Shop metadata
    CREATE TABLE IF NOT EXISTS shop.metadata (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT NOT NULL CHECK (length(trim(name)) > 0),
      description TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT  timestamps CHECK (updated_at >= created_at)
    );

    -- Items
    CREATE TABLE IF NOT EXISTS shop.items (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      shop_id      UUID NOT NULL REFERENCES shop.metadata(id) ON DELETE CASCADE,
      name         TEXT NOT NULL CHECK (length(trim(name)) > 0),
      description  TEXT,
      ean13        TEXT,
      price_cents  INTEGER NOT NULL CHECK (price_cents >= 0 AND price_cents <= 1000000),
      img_data     TEXT,
      active       BOOLEAN NOT NULL DEFAULT TRUE,
      tags         TEXT[] NOT NULL DEFAULT '{}',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT   item_timestamps CHECK (updated_at >= created_at),
      CHECK (ean13 IS NULL OR length(ean13) = 13)
    );

    --  Transactions (financial & stock movements)
    CREATE TABLE IF NOT EXISTS shop.transactions (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      shop_id      UUID NOT NULL REFERENCES shop.metadata(id) ON DELETE CASCADE,
      user_id      TEXT REFERENCES auth.users(id) ON DELETE SET NULL,  -- nullable to survive user deletion
      item_id      UUID REFERENCES shop.items(id),
      amount_cents INTEGER NOT NULL,
      item_amount  INTEGER NOT NULL DEFAULT 0,
      type         TEXT NOT NULL CHECK (type IN ('topup','purchase','restock','loss')),
      description  TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      -- Business rules
      -- topup: credit money to user's balance -> amount_cents < 0, no items
      CONSTRAINT valid_topup CHECK (
        type <> 'topup' OR (item_id IS NULL AND amount_cents < 0 AND item_amount = 0)
      ),
      -- purchase: user buys item -> amount_cents >= 0, item_amount < 0
      CONSTRAINT valid_purchase CHECK (
        type <> 'purchase' OR (item_id IS NOT NULL AND amount_cents >= 0 AND item_amount < 0)
      ),
      -- restock: increase stock -> item_amount > 0 (amount_cents can be 0 or negative if you credit the user)
      CONSTRAINT valid_restock CHECK (
        type <> 'restock' OR (item_id IS NOT NULL AND item_amount > 0)
      ),
      -- loss: shrinkage -> amount_cents = 0, item_amount < 0
      CONSTRAINT valid_loss CHECK (
        type <> 'loss' OR (item_id IS NOT NULL AND amount_cents = 0 AND item_amount < 0)
      )
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS ix_items_lookup   ON shop.items (shop_id);
    CREATE INDEX IF NOT EXISTS ix_items_ean13    ON shop.items (ean13);

    CREATE INDEX IF NOT EXISTS ix_tx_lookup      ON shop.transactions (shop_id);
    CREATE INDEX IF NOT EXISTS ix_tx_user        ON shop.transactions (user_id);
    CREATE INDEX IF NOT EXISTS ix_tx_item        ON shop.transactions (item_id);

    -- Views
    CREATE OR REPLACE VIEW shop.user_balances AS
    SELECT
      shop_id,
      user_id,
      -SUM(amount_cents) AS balance_cents
    FROM shop.transactions
    WHERE user_id IS NOT NULL
    GROUP BY shop_id, user_id;

    CREATE OR REPLACE VIEW shop.items_with_stock AS
    SELECT
      i.*,
      COALESCE(SUM(t.item_amount), 0) AS stock
    FROM shop.items i
    LEFT JOIN shop.transactions t ON t.item_id = i.id
    GROUP BY i.id;
    `.simple();
}
