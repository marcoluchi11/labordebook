# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js 16 + Turbopack)
npm run build    # Production build
npm run lint     # ESLint
```

There is no test suite yet. Playwright is installed (`npx playwright`) and has been used for ad-hoc browser automation/screenshots.

## ⚠️ Next.js 16 Breaking Changes

This project runs **Next.js 16**, which has breaking API changes versus earlier versions. Before modifying any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Specifically:

- **Middleware is now `proxy.ts`** (not `middleware.ts`). The export function is named `proxy`, not `middleware`.
- **`generateStaticParams`** cannot call `cookies()` — use `createServiceRoleClient()` instead of `createClient()`.
- **Webpack config is removed** — Turbopack only. No `webpack:` key in `next.config.ts`.
- **`params` and `searchParams`** in page/route components are `Promise<...>` and must be awaited.

## Architecture Overview

This is an ebook storefront with social DRM / watermarking as anti-piracy protection. Buyers can read online (token-gated viewer) or download a watermarked copy. The watermark embeds buyer name + masked email + purchase ID on every page, making leaked copies traceable.

### Two-layer protection model
1. **Online viewer** (`/read/[bookId]`): PDF.js renders the book in-browser via a 5-minute signed Supabase Storage URL. No download button. Session protected by an HttpOnly cookie set at `/access`.
2. **Download** (`/api/download`): Watermarked PDF/EPUB generated on first request, then cached 7 days in the `watermarks` bucket. Single-use token consumed atomically at download time.

### Supabase clients — use the right one

| Situation | Client to use |
|-----------|--------------|
| Server Components, Route Handlers with user auth context | `createClient()` from `lib/supabase/server.ts` (async, cookie-based, respects RLS) |
| API routes that bypass RLS, `generateStaticParams`, webhooks | `createServiceRoleClient()` from `lib/supabase/server.ts` (sync, service role, no cookies needed) |
| Client Components | `createClient()` from `lib/supabase/client.ts` (browser singleton) |

**Rule**: private bucket files (`books-private`, `watermarks`) must **never** be fetched from the browser. Always stream server-side via Route Handlers.

### Token system (`lib/tokens/index.ts`)

Tokens are 64-char hex (`crypto.randomBytes(32)`). Only the SHA-256 hash is stored in DB — raw tokens are single-use secrets sent in emails.

| Format | Max uses | TTL |
|--------|----------|-----|
| `viewer` | 100 | 365 days |
| `pdf` | 1 | 1 day |
| `epub` | 1 | 1 day |

Token consumption calls the `consume_token(p_token_hash, p_format)` SQL function (in `supabase/migrations/001_initial_schema.sql`) which atomically increments `used_count` and rejects if `used_count >= max_uses`. This prevents race conditions on concurrent requests.

### Payment flow (MercadoPago Checkout Pro)

1. `POST /api/checkout` → creates `purchases` row with `payment_status='pending'` → creates MP preference → returns `initPoint` URL
2. Buyer pays on MP → MP calls `POST /api/webhooks/mercadopago`
3. Webhook verifies signature, calls `mpPayment.get()` to confirm real status, updates purchase to `approved`, creates 3 tokens, sends email via Resend

**Local dev**: `MP_WEBHOOK_SECRET=dev_skip` in `.env.local` skips signature verification in the webhook handler. MP cannot reach `localhost` — use ngrok or MP's test event simulator to trigger webhooks locally.

### Rate limiting (`lib/ratelimit/index.ts`)

Requires Upstash Redis (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`). Limits: checkout 5/IP/hr, viewer session 20/IP/hr, download 10/IP/hr. Currently these env vars are placeholder values — set real ones before deploying or testing rate limit behavior.

### Database RLS rules

- `books`: public `SELECT` for `is_published=true`; all writes via service role only
- `purchases`, `download_tokens`, `watermark_cache`: no client access — service role only
- `admin_users`: users can SELECT their own row

### Storage buckets

| Bucket | Access | Contents |
|--------|--------|----------|
| `books-public` | Public | Cover images, preview PDFs |
| `books-private` | Private | Original PDFs and EPUBs |
| `watermarks` | Private | Watermarked files (cached 7 days) |

### Watermark generation (`lib/watermark/`)

- **PDF** (`pdf-lib`): adds a footer on every page (`Comprado por: Name · email · Pedido #ID · date`) and a diagonal 5%-opacity overlay with the buyer's name
- **EPUB** (`jszip`): injects `<meta>` tags into `content.opf` and a visible watermark paragraph into the first HTML file

Watermarks are generated lazily on first download and cached. Cache path pattern: `pdf/{purchaseId}.pdf` or `epub/{purchaseId}.epub` in the `watermarks` bucket.

### Admin (`/admin/*`)

Protected by `proxy.ts` — checks Supabase Auth session AND membership in `admin_users` table. Redirects to `/admin/login` if either check fails.

### Environment variables

Required for full functionality:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # sb_secret_... format (not a JWT)
MP_ACCESS_TOKEN
NEXT_PUBLIC_MP_PUBLIC_KEY
MP_WEBHOOK_SECRET              # set to "dev_skip" locally to bypass signature check
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_APP_URL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```
