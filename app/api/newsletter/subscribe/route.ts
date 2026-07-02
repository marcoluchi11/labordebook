import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCheckoutLimiter, getClientIp } from '@/lib/ratelimit'

const schema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await getCheckoutLimiter().limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const { email, name } = parsed.data
  const supabase = createServiceRoleClient()

  // Upsert: if already subscribed (even inactive), reactivate
  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert(
      { email, name: name ?? null, is_active: true, unsubscribed_at: null },
      { onConflict: 'email', ignoreDuplicates: false }
    )

  if (error) {
    return NextResponse.json({ error: 'Error al suscribirse' }, { status: 500 })
  }

  // Always return 200 to avoid revealing whether email was already registered
  return NextResponse.json({ ok: true })
}
