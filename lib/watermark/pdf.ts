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
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const pages = pdfDoc.getPages()

  // Insert bookplate page after the cover (index 1)
  const refPage = pages[0]
  const { width, height } = refPage.getSize()
  const bookplatePage = pdfDoc.insertPage(1, [width, height])

  const cx = width / 2
  const gray = rgb(0.2, 0.2, 0.2)
  const lightGray = rgb(0.7, 0.7, 0.7)
  const shortId = data.purchaseId.slice(-8).toUpperCase()

  // Top rule
  bookplatePage.drawLine({ start: { x: 60, y: height - 80 }, end: { x: width - 60, y: height - 80 }, thickness: 0.5, color: lightGray })

  // Title
  const titleText = 'Copia personal'
  const titleSize = 11
  bookplatePage.drawText(titleText, {
    x: cx - font.widthOfTextAtSize(titleText, titleSize) / 2,
    y: height - 110,
    size: titleSize,
    font,
    color: lightGray,
  })

  // Buyer name
  const nameSize = 22
  bookplatePage.drawText(data.buyerName, {
    x: cx - fontBold.widthOfTextAtSize(data.buyerName, nameSize) / 2,
    y: height / 2 + 20,
    size: nameSize,
    font: fontBold,
    color: gray,
  })

  // Order number
  const orderText = `Pedido #${shortId}`
  const orderSize = 11
  bookplatePage.drawText(orderText, {
    x: cx - font.widthOfTextAtSize(orderText, orderSize) / 2,
    y: height / 2 - 16,
    size: orderSize,
    font,
    color: lightGray,
  })

  // Date
  const dateText = data.purchaseDate
  const dateSize = 10
  bookplatePage.drawText(dateText, {
    x: cx - font.widthOfTextAtSize(dateText, dateSize) / 2,
    y: height / 2 - 38,
    size: dateSize,
    font,
    color: lightGray,
  })

  // Bottom rule
  bookplatePage.drawLine({ start: { x: 60, y: 80 }, end: { x: width - 60, y: 80 }, thickness: 0.5, color: lightGray })

  const pages2 = pdfDoc.getPages()

  const footerText = `Comprado por: ${data.buyerName} · ${maskEmail(data.buyerEmail)} · Pedido #${data.purchaseId.slice(-8)} · ${data.purchaseDate}`
  const fontSize = 7
  const color = rgb(0.5, 0.5, 0.5)

  for (const page of pages2) {
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
