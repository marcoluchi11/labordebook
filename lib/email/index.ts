import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
const FROM = process.env.RESEND_FROM_EMAIL!

export interface SendConfirmationEmailParams {
  buyerEmail: string
  buyerName: string
  bookTitle: string
  bookCoverUrl: string | null
  purchaseId: string
  viewerToken: string
  pdfToken: string
  epubToken: string | null
  bookId: string
  isGift?: boolean
}

export async function sendPurchaseConfirmationEmail(params: SendConfirmationEmailParams) {
  const { buyerEmail, buyerName, bookTitle, bookCoverUrl, purchaseId, viewerToken, pdfToken, epubToken, bookId, isGift } = params

  const viewerUrl = `${APP_URL}/api/access?t=${viewerToken}&b=${bookId}&f=viewer`
  const pdfUrl = `${APP_URL}/api/access?t=${pdfToken}&b=${bookId}&f=pdf`
  const epubUrl = epubToken ? `${APP_URL}/api/access?t=${epubToken}&b=${bookId}&f=epub` : null
  const shortPurchaseId = purchaseId.slice(-8).toUpperCase()

  const greeting = isGift
    ? `¡Alguien te regaló un libro, ${buyerName.split(' ')[0]}!`
    : `Tu libro está listo, ${buyerName.split(' ')[0]}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${greeting}</title>
</head>
<body style="font-family: Georgia, serif; background: #fafafa; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
    ${bookCoverUrl ? `<img src="${bookCoverUrl}" alt="${bookTitle}" style="width: 100%; height: 220px; object-fit: cover;">` : ''}
    <div style="padding: 32px;">
      <h1 style="font-size: 22px; color: #111; margin: 0 0 8px;">${greeting}</h1>
      <p style="color: #555; margin: 0 0 24px; font-size: 15px;">${bookTitle}</p>

      <a href="${viewerUrl}" style="display: block; background: #111; color: #fff; text-align: center; padding: 14px 24px; border-radius: 6px; text-decoration: none; font-size: 15px; margin-bottom: 12px;">
        📖 Leer online
      </a>

      <a href="${pdfUrl}" style="display: block; background: #f5f5f5; color: #111; text-align: center; padding: 14px 24px; border-radius: 6px; text-decoration: none; font-size: 15px; margin-bottom: 12px; border: 1px solid #e0e0e0;">
        ⬇️ Descargar PDF
      </a>

      ${epubUrl ? `
      <a href="${epubUrl}" style="display: block; background: #f5f5f5; color: #111; text-align: center; padding: 14px 24px; border-radius: 6px; text-decoration: none; font-size: 15px; margin-bottom: 12px; border: 1px solid #e0e0e0;">
        📚 Descargar EPUB
      </a>` : ''}

      <p style="color: #888; font-size: 12px; margin-top: 24px; line-height: 1.5;">
        Tu descarga incluirá tu nombre como marca de seguridad.<br>
        Pedido #${shortPurchaseId}
      </p>
    </div>
  </div>
</body>
</html>`

  await resend.emails.send({
    from: FROM,
    to: buyerEmail,
    subject: isGift ? `¡Te regalaron "${bookTitle}"!` : `Tu libro está listo — ${bookTitle}`,
    html,
  })
}

export interface SendGiftConfirmationParams {
  buyerEmail: string
  buyerName: string
  recipientEmail: string
  recipientName: string
  bookTitle: string
  bookCoverUrl: string | null
}

export async function sendGiftSentConfirmationEmail(params: SendGiftConfirmationParams) {
  const { buyerEmail, buyerName, recipientEmail, recipientName, bookTitle, bookCoverUrl } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu regalo fue enviado</title>
</head>
<body style="font-family: Georgia, serif; background: #fafafa; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
    ${bookCoverUrl ? `<img src="${bookCoverUrl}" alt="${bookTitle}" style="width: 100%; height: 180px; object-fit: cover;">` : ''}
    <div style="padding: 32px;">
      <h1 style="font-size: 22px; color: #111; margin: 0 0 8px;">🎁 Tu regalo fue enviado</h1>
      <p style="color: #555; margin: 0 0 16px; font-size: 15px;">
        Hola ${buyerName.split(' ')[0]}, tu regalo llegó exitosamente.
      </p>
      <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 6px; font-size: 14px; color: #333;"><strong>Libro:</strong> ${bookTitle}</p>
        <p style="margin: 0; font-size: 14px; color: #333;"><strong>Enviado a:</strong> ${recipientName} (${recipientEmail})</p>
      </div>
      <p style="color: #888; font-size: 13px; line-height: 1.6;">
        ${recipientName.split(' ')[0]} recibirá un email en <strong>${recipientEmail}</strong> con los links para leer y descargar el libro.
      </p>
    </div>
  </div>
</body>
</html>`

  await resend.emails.send({
    from: FROM,
    to: buyerEmail,
    subject: `Tu regalo de "${bookTitle}" fue enviado a ${recipientName}`,
    html,
  })
}

export interface SendNewsletterEmailParams {
  subscriberEmail:  string
  subscriberName?:  string
  subject:          string
  bookData?:        { title: string; author: string; price: number; cover_url: string | null; slug: string }
  unsubscribeToken: string
}

export async function sendNewsletterEmail(params: SendNewsletterEmailParams) {
  const { subscriberEmail, subscriberName, subject, bookData, unsubscribeToken } = params
  const firstName = subscriberName ? `, ${subscriberName.split(' ')[0]}` : ''
  const unsubscribeUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}`

  const bookSection = bookData ? `
    <div style="border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; margin: 24px 0;">
      ${bookData.cover_url ? `<img src="${bookData.cover_url}" alt="${bookData.title}" style="width: 100%; height: 200px; object-fit: cover;">` : ''}
      <div style="padding: 20px;">
        <p style="font-size: 18px; font-weight: bold; color: #111; margin: 0 0 4px;">${bookData.title}</p>
        <p style="font-size: 14px; color: #666; margin: 0 0 16px;">${bookData.author}</p>
        <p style="font-size: 20px; color: #111; font-weight: bold; margin: 0 0 16px;">
          $${bookData.price.toLocaleString('es-AR')}
        </p>
        <a href="${APP_URL}/books/${bookData.slug}"
           style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;">
          Ver libro →
        </a>
      </div>
    </div>` : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Georgia, serif; background: #fafafa; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
    <div style="padding: 32px;">
      <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px;">Laborde Editorial</p>
      <h1 style="font-size: 22px; color: #111; margin: 0 0 8px;">${subject}</h1>
      <p style="color: #555; font-size: 15px; margin: 0 0 8px;">Hola${firstName}.</p>
      ${bookSection}
      <p style="color: #aaa; font-size: 11px; margin-top: 32px; border-top: 1px solid #f0f0f0; padding-top: 16px;">
        Recibiste este email porque te suscribiste a las novedades de Laborde Editorial.<br>
        <a href="${unsubscribeUrl}" style="color: #aaa;">Darme de baja</a>
      </p>
    </div>
  </div>
</body>
</html>`

  await resend.emails.send({ from: FROM, to: subscriberEmail, subject, html })
}
