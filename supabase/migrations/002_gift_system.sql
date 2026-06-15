-- Add gift system support to purchases table
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS is_gift         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recipient_email text,
  ADD COLUMN IF NOT EXISTS recipient_name  text;

COMMENT ON COLUMN purchases.is_gift IS 'True if buyer is gifting the book to someone else';
COMMENT ON COLUMN purchases.recipient_email IS 'Email of the gift recipient (tokens are sent here instead of buyer_email)';
COMMENT ON COLUMN purchases.recipient_name IS 'Name of the gift recipient (used in the access email)';
