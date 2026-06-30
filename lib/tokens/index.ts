import { createHash, randomBytes } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'

export type TokenFormat = 'viewer' | 'pdf' | 'epub'

const TOKEN_CONFIG: Record<TokenFormat, { maxUses: number; ttlDays: number }> = {
  viewer: { maxUses: 100, ttlDays: 365 },
  pdf:    { maxUses: 1,   ttlDays: 1 },
  epub:   { maxUses: 1,   ttlDays: 1 },
}

export function generateRawToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

export async function createToken(purchaseId: string, format: TokenFormat): Promise<string> {
  const raw = generateRawToken()
  const hash = hashToken(raw)
  const config = TOKEN_CONFIG[format]
  const expiresAt = new Date(Date.now() + config.ttlDays * 24 * 60 * 60 * 1000).toISOString()

  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('download_tokens').insert({
    purchase_id: purchaseId,
    token_hash: hash,
    format,
    expires_at: expiresAt,
    max_uses: config.maxUses,
  })

  if (error) throw new Error(`Failed to create token: ${error.message}`)
  return raw
}

// Atomically increments used_count via SQL function to prevent race conditions.
// Throws if token is invalid, expired, revoked, or exhausted.
export async function consumeToken(rawToken: string, format: TokenFormat): Promise<{ purchaseId: string }> {
  const hash = hashToken(rawToken)
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .rpc('consume_token', { p_token_hash: hash, p_format: format })

  if (error || !data) {
    throw new Error('Token inválido, expirado o ya utilizado')
  }

  return { purchaseId: (data as { purchase_id: string }).purchase_id }
}

// For viewer tokens: validates without consuming (viewer has 100 uses, so we just increment).
export async function validateViewerCookie(rawToken: string): Promise<{ purchaseId: string; bookId: string } | null> {
  const hash = hashToken(rawToken)
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('download_tokens')
    .select('purchase_id, used_count, max_uses, purchases!inner(book_id)')
    .eq('token_hash', hash)
    .eq('format', 'viewer')
    .eq('revoked', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data || data.used_count >= data.max_uses) return null

  await supabase
    .from('download_tokens')
    .update({ used_count: data.used_count + 1, last_used_at: new Date().toISOString() })
    .eq('token_hash', hash)

  const purchase = (data.purchases as unknown as { book_id: string })
  return { purchaseId: data.purchase_id, bookId: purchase.book_id }
}

export async function revokeTokensForPurchase(purchaseId: string): Promise<void> {
  const supabase = createServiceRoleClient()
  await supabase
    .from('download_tokens')
    .update({ revoked: true })
    .eq('purchase_id', purchaseId)
}
