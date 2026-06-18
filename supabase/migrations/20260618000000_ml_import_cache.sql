-- Cache table for Mercado Livre product search results.
-- Reduces redundant external API calls for repeated queries (popular barcodes, common searches).
-- Service-role only (Edge Function) — no user-facing RLS policy.

CREATE TABLE IF NOT EXISTS ml_search_cache (
  cache_key   text        PRIMARY KEY,
  payload     jsonb       NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE ml_search_cache ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies: only the service-role key
-- (used by Edge Functions) bypasses RLS. The anon / authenticated roles
-- must never touch this table directly.

CREATE INDEX IF NOT EXISTS ml_search_cache_expires_at_idx
  ON ml_search_cache (expires_at);
