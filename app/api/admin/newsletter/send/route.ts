import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { sendNewsletterEmail } from '@/lib/email'

const schema = z.object({
  subject: z.string().min(1).max(200),
  bookId:  z.string().uuid().optional(),
})

async function requireAdmin(supabase: ReturnType<typeof createServiceRoleClient>) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('admin_users').select('id').eq('id', user.id).single()
  return data ? user : null
}

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { subject, bookId } = parsed.data

  // Fetch active subscribers
  const { data: subscribers, error: subError } = await supabase
    .from('newsletter_subscribers')
    .select('email, name, unsubscribe_token')
    .eq('is_active', true)

  if (subError) {
    return NextResponse.json({ error: 'Error al obtener suscriptores' }, { status: 500 })
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0 })
  }

  // Optionally fetch book data
  let bookData: { title: string; author: string; price: number; cover_url: string | null; slug: string } | undefined
  if (bookId) {
    const { data: book } = await supabase
      .from('books')
      .select('title, author, price, cover_url, slug')
      .eq('id', bookId)
      .single()
    if (book) bookData = book
  }

  // Send in batches of 50 to avoid timeouts
  const BATCH = 50
  let sent = 0
  let failed = 0

  for (let i = 0; i < subscribers.length; i += BATCH) {
    const batch = subscribers.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      batch.map(sub =>
        sendNewsletterEmail({
          subscriberEmail:  sub.email,
          subscriberName:   sub.name ?? undefined,
          subject,
          bookData,
          unsubscribeToken: sub.unsubscribe_token,
        })
      )
    )
    for (const r of results) {
      if (r.status === 'fulfilled') sent++
      else failed++
    }
  }

  return NextResponse.json({ ok: true, sent, failed })
}
