-- Free-preview reader: control how many pages of each book are readable for free.
-- The online viewer becomes free for everyone, but only shows the first N pages;
-- to read more the buyer must purchase. N is configurable per book (default 6).
--
-- `preview_pdf_url` already exists (migration 001) and now stores the storage path
-- of the generated, cached preview PDF inside the public `books-public` bucket.

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS preview_pages integer NOT NULL DEFAULT 6;

-- No new RLS policy needed: this is a new column on an existing table.
-- `books` already exposes SELECT for is_published = true and restricts writes
-- to the service role, which is exactly what the preview flow needs.

-- Rollback:
--   ALTER TABLE books DROP COLUMN IF EXISTS preview_pages;
