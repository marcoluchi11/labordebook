-- Add publisher and publication year to books
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS publisher     text,
  ADD COLUMN IF NOT EXISTS published_year integer;
