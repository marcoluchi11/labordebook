-- ============================================================
-- Ebook Store — Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- BOOKS
-- ============================================================
CREATE TABLE books (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text UNIQUE NOT NULL,
  title            text NOT NULL,
  author           text NOT NULL,
  description      text,
  long_description text,
  price            numeric(10,2) NOT NULL,
  cover_url        text,
  preview_pdf_url  text,
  pdf_path         text NOT NULL,
  epub_path        text,
  page_count       integer,
  language         text NOT NULL DEFAULT 'es',
  tags             text[] DEFAULT '{}',
  is_published     boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Anyone can read published books
CREATE POLICY "books_public_select"
  ON books FOR SELECT
  USING (is_published = true);

-- Only service role can write (all admin mutations go through server-side API routes)

-- ============================================================
-- PURCHASES
-- ============================================================
CREATE TABLE purchases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id         uuid NOT NULL REFERENCES books(id),
  buyer_email     text NOT NULL,
  buyer_name      text NOT NULL,
  payment_id      text UNIQUE,
  payment_status  text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','approved','rejected','refunded')),
  amount_paid     numeric(10,2),
  currency        text NOT NULL DEFAULT 'ARS',
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  confirmed_at    timestamptz
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- No client access — all mutations via service role in API routes

-- ============================================================
-- DOWNLOAD TOKENS
-- ============================================================
CREATE TABLE download_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id  uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  token_hash   text UNIQUE NOT NULL,
  format       text NOT NULL CHECK (format IN ('viewer','pdf','epub')),
  expires_at   timestamptz NOT NULL,
  used_count   integer NOT NULL DEFAULT 0,
  max_uses     integer NOT NULL DEFAULT 1,
  last_used_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  revoked      boolean NOT NULL DEFAULT false
);

ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;
-- No client access

-- ============================================================
-- WATERMARK CACHE
-- ============================================================
CREATE TABLE watermark_cache (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id     uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  format          text NOT NULL CHECK (format IN ('pdf','epub')),
  storage_path    text NOT NULL,
  generated_at    timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  file_size_bytes bigint,
  UNIQUE (purchase_id, format)
);

ALTER TABLE watermark_cache ENABLE ROW LEVEL SECURITY;
-- No client access

-- ============================================================
-- ADMIN USERS
-- ============================================================
CREATE TABLE admin_users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  role       text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin can read their own record
CREATE POLICY "admin_users_self_select"
  ON admin_users FOR SELECT
  USING (auth.uid() = id);

-- ============================================================
-- UPDATED_AT TRIGGER FOR BOOKS
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TOKEN CONSUMPTION — atomic, prevents race conditions
-- ============================================================
CREATE OR REPLACE FUNCTION consume_token(p_token_hash text, p_format text)
RETURNS download_tokens AS $$
DECLARE
  result download_tokens;
BEGIN
  UPDATE download_tokens
  SET
    used_count   = used_count + 1,
    last_used_at = now()
  WHERE token_hash = p_token_hash
    AND format     = p_format
    AND revoked    = false
    AND expires_at > now()
    AND used_count < max_uses
  RETURNING * INTO result;

  IF result IS NULL THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ANALYTICS — RPC FUNCTIONS (called with service role)
-- ============================================================

-- Monthly revenue
CREATE OR REPLACE FUNCTION get_monthly_revenue()
RETURNS TABLE(month text, revenue numeric) AS $$
  SELECT
    to_char(date_trunc('month', confirmed_at), 'YYYY-MM') AS month,
    SUM(amount_paid) AS revenue
  FROM purchases
  WHERE payment_status = 'approved'
    AND confirmed_at IS NOT NULL
  GROUP BY 1
  ORDER BY 1 DESC
  LIMIT 12;
$$ LANGUAGE sql SECURITY DEFINER;

-- Purchases per book
CREATE OR REPLACE FUNCTION get_purchases_per_book()
RETURNS TABLE(book_title text, purchase_count bigint, total_revenue numeric) AS $$
  SELECT
    b.title AS book_title,
    COUNT(p.id) AS purchase_count,
    COALESCE(SUM(p.amount_paid), 0) AS total_revenue
  FROM books b
  LEFT JOIN purchases p ON p.book_id = b.id AND p.payment_status = 'approved'
  GROUP BY b.id, b.title
  ORDER BY purchase_count DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- Daily purchases (last 30 days)
CREATE OR REPLACE FUNCTION get_daily_purchases(days_back integer DEFAULT 30)
RETURNS TABLE(day text, count bigint) AS $$
  SELECT
    to_char(date_trunc('day', confirmed_at), 'YYYY-MM-DD') AS day,
    COUNT(*) AS count
  FROM purchases
  WHERE payment_status = 'approved'
    AND confirmed_at >= now() - (days_back || ' days')::interval
  GROUP BY 1
  ORDER BY 1 ASC;
$$ LANGUAGE sql SECURITY DEFINER;
