# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git

**No hacer commits automáticamente.** Solo commitear cuando el usuario lo pida explícitamente.

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

## Frontend & mobile conventions

This storefront is read mostly on phones — buyers open the purchase email and read/download from mobile. **Mobile is the default target, not an afterthought.** Build mobile-first and verify on a 390px viewport before treating any UI as done.

### Verify on real viewports (don't assume)
- Playwright is already installed. When changing UI, take a screenshot at **390×844** (iPhone) and **360×800** (common Android) and actually look at it before declaring it done. Check the **768px** breakpoint too for tablet/desktop.
- On any screen with an input (`/access`, checkout), test with the on-screen keyboard open: the focused field must stay visible and not be covered by the keyboard.

### The reader (`/read/[bookId]`) is the make-or-break mobile screen
- PDF.js must render **fit-to-width by default** on mobile. Never require horizontal scrolling to read a line of text.
- **Pinch-zoom and double-tap zoom must work.** Do not disable user scaling in the viewport meta tag (`user-scalable=no` / `maximum-scale=1` are banned here).
- Page navigation controls sit within thumb reach (bottom of screen), are **≥44px touch targets**, and have enough spacing to avoid mis-taps.
- Respect **safe areas** with `env(safe-area-inset-*)` so controls don't end up under the notch or home indicator.

### General rules
- Touch targets **≥44×44px**. Hover is never the only way to reach an action (no hover-only menus or tooltips that hide critical controls).
- No fixed widths that overflow 360px. Use fluid / `max-width` layouts. **No element should trigger horizontal scroll** on a phone.
- Respect `prefers-reduced-motion`; keep animation minimal and purposeful.
- Visible keyboard focus on every interactive element.
- The MercadoPago redirect (`initPoint`) must open correctly in mobile browsers and return cleanly to the app. **Test the full pay → return loop on a phone**, not only on desktop.

### Admin (`/admin/*`)
- Lower mobile priority (used mostly from desktop), but login and the core actions should still be usable on a phone. Don't spend the mobile-polish budget here first.

## Security & privacy review

Run the built-in **`/security-review`** before every deploy. The automated pass catches generic issues (injection, XSS, exposed secrets, vulnerable deps); the rules below are the **project-specific** things it won't know to check. Treat all findings as *detect-and-explain* — review each one before applying a fix, especially anything touching RLS, tokens, or payments. An automatic "fix" to auth logic is more dangerous than the original finding.

### Hardening rules grounded in this codebase
- **Rate limiting must be live in production.** `UPSTASH_REDIS_*` are placeholders today. If they're unset or placeholder, the rate limiter silently no-ops and checkout / viewer / download are left unprotected against abuse. **Fail closed**: assert real values at boot in production, or block the deploy if they're missing.
- **`MP_WEBHOOK_SECRET=dev_skip` must never reach a deployed environment.** It bypasses webhook signature verification — in production that would let an attacker forge payment confirmations and mint tokens + emails for free. The webhook handler must **refuse to skip verification when `NODE_ENV==='production'`**, regardless of the secret's value.
- **New tables are RLS-on by default.** Any migration that creates a table enables RLS and defines its policies in the same migration. No client-reachable table without an explicit policy. Default to service-role-only access unless there's a concrete reason for client access.
- **Secrets never touch the client bundle.** Only `NEXT_PUBLIC_*` vars may appear client-side. `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN`, `RESEND_API_KEY`, etc. stay server-only. Private buckets (`books-private`, `watermarks`) are streamed server-side only (existing rule — keep enforcing it).
- **Signed Storage URLs stay short-lived** (viewer = 5 min). Don't lengthen the TTL to "fix" a UX problem — re-issue the URL instead.
- **Raw tokens are single-use secrets.** Never log them; only the SHA-256 hash is ever stored. Keep consumption atomic via `consume_token`.

### Privacy (PII)
- Watermarks embed buyer name + **masked** email + purchase ID. Keep the email masked consistently; never embed the full address.
- **Do not log PII** (buyer name, full email, raw tokens) in server logs or error reports. Scrub before sending anything to an external service (error tracking, analytics).
- Honor the data lifecycle already designed: watermark cache 7 days, token TTLs as specified. Don't silently extend retention.
- Purchase emails (Resend) carry single-use secret links. Don't add extra exposure — e.g. never put a token in a URL that gets logged by analytics or a third-party script.

### Supabase-specific (what code scanners miss)
- RLS can't be fully verified from a code scan. Check the **actual policies** with SQL (`select * from pg_policies;`) and review Supabase's **Security Advisor** in the dashboard. A table with RLS enabled but no policy is either locked or wide open depending on context — verify the intent matches.
- Confirm SQL functions like `consume_token` run with the intended privileges (`SECURITY DEFINER` vs `INVOKER`) and aren't callable by the `anon` role in unintended ways.
