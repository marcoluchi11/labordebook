import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mpPayment } from '@/lib/mercadopago/client'
import { verifyMPSignature } from '@/lib/mercadopago/webhook'
import { createToken } from '@/lib/tokens'
import { sendPurchaseConfirmationEmail, sendGiftSentConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || body.type !== 'payment') {
    // MP sends other notification types (merchant_order, etc.) — acknowledge silently
    return NextResponse.json({ ok: true })
  }

  const paymentId = String(body.data?.id ?? '')
  if (!paymentId) return NextResponse.json({ ok: true })

  // #3 — dev_skip is only allowed outside production
  const secret = process.env.MP_WEBHOOK_SECRET!
  if (secret === 'dev_skip') {
    if (process.env.NODE_ENV === 'production') {
      console.error('[webhook] MP_WEBHOOK_SECRET=dev_skip está prohibido en producción')
      return NextResponse.json({ error: 'Configuración inválida' }, { status: 500 })
    }
    // dev mode: skip signature verification
  } else {
    // #4 — constant-time signature verification (timingSafeEqual inside verifyMPSignature)
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    if (!verifyMPSignature(xSignature, xRequestId, paymentId, secret)) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }
  }

  // Fetch real payment status from MP (never trust the webhook body alone)
  const payment = await mpPayment.get({ id: paymentId })

  if (payment.status !== 'approved') {
    if (payment.status === 'rejected' && payment.external_reference) {
      const rejectedIds = payment.external_reference.split(',').filter(Boolean)
      const supabase = createServiceRoleClient()
      await supabase
        .from('purchases')
        .update({ payment_status: 'rejected' })
        .in('id', rejectedIds)
        .eq('payment_status', 'pending')
    }
    return NextResponse.json({ ok: true })
  }

  const externalRef = payment.external_reference
  if (!externalRef) return NextResponse.json({ ok: true })

  // Support both single purchase (legacy) and multi-purchase (cart checkout)
  const purchaseIds = externalRef.split(',').filter(Boolean)

  const supabase = createServiceRoleClient()

  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, payment_status, payment_id, book_id, buyer_name, buyer_email, is_gift, recipient_email, recipient_name, amount_paid')
    .in('id', purchaseIds)

  if (!purchases || purchases.length === 0) return NextResponse.json({ ok: true })

  // #2 — Idempotency: skip if this paymentId was already recorded on any of these purchases.
  // payment_id is stored as "paymentId:purchaseId" to keep values unique per row (DB UNIQUE constraint).
  const alreadyProcessed = purchases.some(
    (p) => p.payment_id === paymentId || p.payment_id?.startsWith(paymentId + ':')
  )
  if (alreadyProcessed) {
    console.log(`[webhook] paymentId ${paymentId} ya procesado, ignorando`)
    return NextResponse.json({ ok: true })
  }

  const pending = purchases.filter((p) => p.payment_status !== 'approved')
  if (pending.length === 0) return NextResponse.json({ ok: true })

  // #1 — Verify that the amount paid matches the sum of expected book prices.
  // amount_paid is set server-side at checkout time from the DB price, so it's authoritative.
  const expectedTotal = purchases.reduce((sum, p) => sum + Number(p.amount_paid ?? 0), 0)
  const paidAmount = Number(payment.transaction_amount ?? 0)

  if (Math.abs(paidAmount - expectedTotal) > 1) {
    console.error(
      `[webhook] Monto incorrecto: pagado ${paidAmount}, esperado ${expectedTotal} ` +
      `(purchases: ${purchaseIds.join(', ')})`
    )
    // Return ok to prevent MP retries — this is a fraud signal, not a transient error
    return NextResponse.json({ ok: true })
  }

  const confirmedAt = new Date().toISOString()

  // Create tokens and send email for each pending purchase.
  // Update happens per-purchase (not bulk) because payment_id must be unique per row.
  await Promise.all(
    pending.map(async (purchase) => {
      const { error: updateError } = await supabase
        .from('purchases')
        .update({
          payment_status: 'approved',
          payment_id: `${paymentId}:${purchase.id}`,
          confirmed_at: confirmedAt,
        })
        .eq('id', purchase.id)

      if (updateError) {
        console.error(`[webhook] Error actualizando purchase ${purchase.id}:`, updateError)
        return
      }

      const { data: book } = await supabase
        .from('books')
        .select('id, title, cover_url, epub_path')
        .eq('id', purchase.book_id)
        .single()

      if (!book) return

      const [viewerToken, pdfToken, epubToken] = await Promise.all([
        createToken(purchase.id, 'viewer'),
        createToken(purchase.id, 'pdf'),
        book.epub_path ? createToken(purchase.id, 'epub') : Promise.resolve(null),
      ])

      if (purchase.is_gift && purchase.recipient_email && purchase.recipient_name) {
        await Promise.all([
          sendPurchaseConfirmationEmail({
            buyerEmail: purchase.recipient_email,
            buyerName: purchase.recipient_name,
            bookTitle: book.title,
            bookCoverUrl: book.cover_url,
            purchaseId: purchase.id,
            viewerToken,
            pdfToken,
            epubToken,
            bookId: book.id,
            isGift: true,
          }),
          sendGiftSentConfirmationEmail({
            buyerEmail: purchase.buyer_email,
            buyerName: purchase.buyer_name,
            recipientEmail: purchase.recipient_email,
            recipientName: purchase.recipient_name,
            bookTitle: book.title,
            bookCoverUrl: book.cover_url,
          }),
        ])
      } else {
        await sendPurchaseConfirmationEmail({
          buyerEmail: purchase.buyer_email,
          buyerName: purchase.buyer_name,
          bookTitle: book.title,
          bookCoverUrl: book.cover_url,
          purchaseId: purchase.id,
          viewerToken,
          pdfToken,
          epubToken,
          bookId: book.id,
        })
      }
    })
  )

  return NextResponse.json({ ok: true })
}
