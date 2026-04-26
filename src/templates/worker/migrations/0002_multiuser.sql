CREATE TABLE IF NOT EXISTS users (
  token_hash TEXT PRIMARY KEY,
  label TEXT,
  created_at INTEGER NOT NULL,
  is_admin INTEGER DEFAULT 0
);

ALTER TABLE artifacts ADD COLUMN token_hash TEXT;
