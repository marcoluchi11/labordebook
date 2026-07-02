CREATE TABLE newsletter_subscribers (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text        UNIQUE NOT NULL,
  name              text,
  subscribed_at     timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at   timestamptz,
  unsubscribe_token text        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active         boolean     NOT NULL DEFAULT true
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- No client-side policies: service role only
