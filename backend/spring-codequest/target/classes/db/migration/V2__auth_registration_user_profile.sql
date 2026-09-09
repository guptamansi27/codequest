ALTER TABLE apis_user
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE apis_user
SET full_name = COALESCE(NULLIF(full_name, ''), email)
WHERE full_name IS NULL OR full_name = '';

UPDATE apis_user
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;
