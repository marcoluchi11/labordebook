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
}

export async function sendPurchaseConfirmationEmail(params: SendConfirmationEmailParams) {
  const { buyerEmail, buyerName, bookTitle, bookCoverUrl, purchaseId, viewerToken, pdfToken, epubToken, bookId } = params

  const viewerUrl = `${APP_URL}/access?t=${viewerToken}&b=${bookId}&f=viewer`
  const pdfUrl = `${APP_URL}/access?t=${pdfToken}&b=${bookId}&f=pdf`
  const epubUrl = epubToken ? `${APP_URL}/access?t=${epubToken}&b=${bookId}&f=epub` : null
  const shortPurchaseId = purchaseId.slice(-8).toUpperCase()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu libro está listo</title>
</head>
<body style="font-family: Georgia, serif; background: #fafafa; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
    ${bookCoverUrl ? `<img src="${bookCoverUrl}" alt="${bookTitle}" style="width: 100%; height: 220px; object-fit: cover;">` : ''}
    <div style="padding: 32px;">
      <h1 style="font-size: 22px; color: #111; margin: 0 0 8px;">Tu libro está listo, ${buyerName.split(' ')[0]}</h1>
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
    subject: `Tu libro está listo — ${bookTitle}`,
    html,
  })
}
