ALTER TABLE artifacts ADD COLUMN slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_slug ON artifacts(slug);
