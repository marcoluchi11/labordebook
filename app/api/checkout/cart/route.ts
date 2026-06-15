import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mpPreference } from '@/lib/mercadopago/client'
import { getCheckoutLimiter, getClientIp } from '@/lib/ratelimit'

const schema = z.object({
  bookIds: z.array(z.string().uuid()).min(1).max(20),
  buyerName: z.string().min(2).max(100),
  buyerEmail: z.string().email(),
  isGift: z.boolean().optional().default(false),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().min(2).max(100).optional(),
})

export async function POST(request: NextRequest) {
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

  const { bookIds, buyerName, buyerEmail, isGift, recipientEmail, recipientName } = parsed.data
  const supabase = createServiceRoleClient()

  // Fetch all books
  const { data: books } = await supabase
    .from('books')
    .select('id, title, price')
    .in('id', bookIds)
    .eq('is_published', true)

  if (!books || books.length === 0) {
    return NextResponse.json({ error: 'Libros no encontrados' }, { status: 404 })
  }

  // Create a pending purchase for each book
  const { data: purchases, error: purchaseError } = await supabase
    .from('purchases')
    .insert(
      books.map(book => ({
        book_id: book.id,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        payment_status: 'pending',
        amount_paid: book.price,
        ip_address: ip,
        user_agent: request.headers.get('user-agent'),
        is_gift: isGift,
        recipient_email: isGift ? recipientEmail : null,
        recipient_name: isGift ? recipientName : null,
      }))
    )
    .select('id')

  if (purchaseError || !purchases || purchases.length === 0) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }

  // external_reference = comma-separated purchase IDs
  const externalReference = purchases.map(p => p.id).join(',')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  try {
    const preference = await mpPreference.create({
      body: {
        items: books.map(book => ({
          id: book.id,
          title: book.title,
          quantity: 1,
          unit_price: Number(book.price),
          currency_id: 'ARS',
        })),
        payer: { email: buyerEmail, name: buyerName },
        back_urls: {
          success: `${appUrl}/purchase/success`,
          failure: `${appUrl}/purchase/failure`,
          pending: `${appUrl}/purchase/pending`,
        },
        ...(appUrl.includes('localhost') ? {} : { auto_return: 'approved' as const }),
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        external_reference: externalReference,
        statement_descriptor: 'LIBRERIA EBOOKS',
        expires: true,
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    })

    return NextResponse.json({ initPoint: preference.init_point })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[checkout/cart] MP preference.create failed:', msg)
    return NextResponse.json({ error: `Error MP: ${msg}` }, { status: 500 })
  }
}
