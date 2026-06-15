import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mpPreference } from '@/lib/mercadopago/client'
import { getCheckoutLimiter, getClientIp } from '@/lib/ratelimit'

const schema = z.object({
  bookId: z.string().uuid(),
  buyerName: z.string().min(2).max(100),
  buyerEmail: z.string().email(),
})

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request)
  const limiter = getCheckoutLimiter()
  const { success } = await limiter.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { bookId, buyerName, buyerEmail } = parsed.data
  const supabase = createServiceRoleClient()

  // Fetch book
  const { data: book } = await supabase
    .from('books')
    .select('id, title, price')
    .eq('id', bookId)
    .eq('is_published', true)
    .single()

  if (!book) {
    return NextResponse.json({ error: 'Libro no encontrado' }, { status: 404 })
  }

  // Create pending purchase
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      book_id: bookId,
      buyer_email: buyerEmail,
      buyer_name: buyerName,
      payment_status: 'pending',
      amount_paid: book.price,
      ip_address: ip,
      user_agent: request.headers.get('user-agent'),
    })
    .select('id')
    .single()

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Create MercadoPago preference
  let preference: Awaited<ReturnType<typeof mpPreference.create>>
  try {
    preference = await mpPreference.create({
    body: {
      items: [
        {
          id: bookId,
          title: book.title,
          quantity: 1,
          unit_price: Number(book.price),
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: buyerEmail,
        name: buyerName,
      },
      back_urls: {
        success: `${appUrl}/purchase/success`,
        failure: `${appUrl}/purchase/failure`,
        pending: `${appUrl}/purchase/pending`,
      },
      // auto_return requires a public URL — omit on localhost
      ...(appUrl.includes('localhost') ? {} : { auto_return: 'approved' as const }),
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      external_reference: purchase.id,
      statement_descriptor: 'LIBRERIA EBOOKS',
      expires: true,
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[checkout] MP preference.create failed:', msg)
    return NextResponse.json({ error: `Error MP: ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ initPoint: preference.init_point })
}
