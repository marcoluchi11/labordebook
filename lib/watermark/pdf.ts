import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'

export interface WatermarkData {
  buyerName: string
  buyerEmail: string
  purchaseId: string
  purchaseDate: string
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return email
  const masked = user.slice(0, 3) + '***'
  return `${masked}@${domain}`
}

export async function watermarkPdf(
  originalBytes: ArrayBuffer,
  data: WatermarkData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const pages = pdfDoc.getPages()

  const footerText = `Comprado por: ${data.buyerName} · ${maskEmail(data.buyerEmail)} · Pedido #${data.purchaseId.slice(-8)} · ${data.purchaseDate}`
  const fontSize = 7
  const color = rgb(0.5, 0.5, 0.5)

  for (const page of pages) {
    const { width } = page.getSize()
    const textWidth = font.widthOfTextAtSize(footerText, fontSize)
    const x = (width - textWidth) / 2

    // Footer watermark
    page.drawText(footerText, {
      x,
      y: 12,
      size: fontSize,
      font,
      color,
      opacity: 0.7,
    })

    // Subtle diagonal overlay
    page.drawText(data.buyerName, {
      x: 60,
      y: 200,
      size: 48,
      font,
      color: rgb(0.85, 0.85, 0.85),
      opacity: 0.05,
      rotate: degrees(35),
    })
  }

  return pdfDoc.save()
}
