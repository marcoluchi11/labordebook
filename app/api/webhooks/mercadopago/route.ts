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

  // Verify webhook signature (skip in dev with placeholder secret)
  const secret = process.env.MP_WEBHOOK_SECRET!
  if (secret !== 'dev_skip') {
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
        .update({ payment_status: 'rejected', payment_id: paymentId })
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
    .select('id, payment_status, book_id, buyer_name, buyer_email, is_gift, recipient_email, recipient_name')
    .in('id', purchaseIds)

  if (!purchases || purchases.length === 0) return NextResponse.json({ ok: true })

  // Idempotency: skip if all are already approved
  const pending = purchases.filter(p => p.payment_status !== 'approved')
  if (pending.length === 0) return NextResponse.json({ ok: true })

  // Confirm all pending purchases
  const confirmedAt = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('purchases')
    .update({
      payment_status: 'approved',
      payment_id: paymentId,
      confirmed_at: confirmedAt,
      amount_paid: payment.transaction_amount
        ? Number(payment.transaction_amount) / pending.length
        : null,
    })
    .in('id', pending.map(p => p.id))

  if (updateError) {
    console.error('Failed to update purchases', updateError)
    return NextResponse.json({ ok: true })
  }

  // Create tokens and send email for each purchase
  await Promise.all(
    pending.map(async (purchase) => {
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
        // Gift: send access to recipient, confirmation to buyer
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
