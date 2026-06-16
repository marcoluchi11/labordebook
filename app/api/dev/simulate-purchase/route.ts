import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createToken } from '@/lib/tokens'
import { sendPurchaseConfirmationEmail, sendGiftSentConfirmationEmail } from '@/lib/email'

// Only available when MP_WEBHOOK_SECRET=dev_skip (local development)
export async function POST(request: NextRequest) {
  if (process.env.MP_WEBHOOK_SECRET !== 'dev_skip') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const { purchaseId } = await request.json().catch(() => ({}))
  if (!purchaseId) {
    return NextResponse.json({ error: 'purchaseId requerido' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  const { data: purchase } = await supabase
    .from('purchases')
    .select('id, payment_status, book_id, buyer_name, buyer_email, is_gift, recipient_email, recipient_name')
    .eq('id', purchaseId)
    .single()

  if (!purchase) {
    return NextResponse.json({ error: 'Purchase no encontrado' }, { status: 404 })
  }

  if (purchase.payment_status === 'approved') {
    return NextResponse.json({ error: 'Ya está aprobado' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('purchases')
    .update({ payment_status: 'approved', payment_id: 'dev_simulate', confirmed_at: new Date().toISOString() })
    .eq('id', purchaseId)

  if (updateError) {
    console.error('[simulate] update error:', updateError)
    return NextResponse.json({ error: 'Error al aprobar la compra', detail: updateError.message }, { status: 500 })
  }

  const { data: book } = await supabase
    .from('books')
    .select('id, title, cover_url, epub_path')
    .eq('id', purchase.book_id)
    .single()

  if (!book) return NextResponse.json({ error: 'Libro no encontrado' }, { status: 404 })

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

  return NextResponse.json({ ok: true, purchaseId, bookTitle: book.title, buyerEmail: purchase.buyer_email })
}
