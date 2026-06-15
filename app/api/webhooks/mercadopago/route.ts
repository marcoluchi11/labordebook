import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mpPayment } from '@/lib/mercadopago/client'
import { verifyMPSignature } from '@/lib/mercadopago/webhook'
import { createToken } from '@/lib/tokens'
import { sendPurchaseConfirmationEmail } from '@/lib/email'

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
    // Update purchase status if rejected
    if (payment.status === 'rejected' && payment.external_reference) {
      const supabase = createServiceRoleClient()
      await supabase
        .from('purchases')
        .update({ payment_status: 'rejected', payment_id: paymentId })
        .eq('id', payment.external_reference)
        .eq('payment_status', 'pending')
    }
    return NextResponse.json({ ok: true })
  }

  const purchaseId = payment.external_reference
  if (!purchaseId) return NextResponse.json({ ok: true })

  const supabase = createServiceRoleClient()

  // Idempotency check — prevent duplicate processing
  const { data: existing } = await supabase
    .from('purchases')
    .select('id, payment_status, book_id, buyer_name, buyer_email')
    .eq('id', purchaseId)
    .single()

  if (!existing) return NextResponse.json({ ok: true })
  if (existing.payment_status === 'approved') return NextResponse.json({ ok: true })

  // Confirm the purchase
  const { error: updateError } = await supabase
    .from('purchases')
    .update({
      payment_status: 'approved',
      payment_id: paymentId,
      confirmed_at: new Date().toISOString(),
      amount_paid: payment.transaction_amount,
    })
    .eq('id', purchaseId)

  if (updateError) {
    console.error('Failed to update purchase', updateError)
    return NextResponse.json({ ok: true })
  }

  // Fetch book for email
  const { data: book } = await supabase
    .from('books')
    .select('id, title, cover_url, epub_path')
    .eq('id', existing.book_id)
    .single()

  if (!book) return NextResponse.json({ ok: true })

  // Create access tokens
  const [viewerToken, pdfToken, epubToken] = await Promise.all([
    createToken(purchaseId, 'viewer'),
    createToken(purchaseId, 'pdf'),
    book.epub_path ? createToken(purchaseId, 'epub') : Promise.resolve(null),
  ])

  // Send confirmation email
  await sendPurchaseConfirmationEmail({
    buyerEmail: existing.buyer_email,
    buyerName: existing.buyer_name,
    bookTitle: book.title,
    bookCoverUrl: book.cover_url,
    purchaseId,
    viewerToken,
    pdfToken,
    epubToken,
    bookId: book.id,
  })

  return NextResponse.json({ ok: true })
}
