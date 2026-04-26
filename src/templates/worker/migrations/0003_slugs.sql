ALTER TABLE artifacts ADD COLUMN slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_slug ON artifacts(slug);
