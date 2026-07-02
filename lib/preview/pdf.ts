import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

/**
 * Build a free-preview PDF containing only the first `n` pages of the original.
 *
 * The full book is never sent to the browser in preview mode — only this
 * server-side truncated copy is. Every page gets a discreet "MUESTRA GRATUITA"
 * footer so a preview can't be passed off as the complete book.
 */
export async function extractFirstPages(
  originalBytes: ArrayBuffer,
  n: number
): Promise<Uint8Array> {
  const src = await PDFDocument.load(originalBytes)
  const total = src.getPageCount()
  const count = Math.max(1, Math.min(n, total))

  const out = await PDFDocument.create()
  const indices = Array.from({ length: count }, (_, i) => i)
  const copied = await out.copyPages(src, indices)
  for (const page of copied) out.addPage(page)

  const font = await out.embedFont(StandardFonts.Helvetica)
  const label = 'MUESTRA GRATUITA'
  const size = 8
  const color = rgb(0.5, 0.5, 0.5)

  for (const page of out.getPages()) {
    const { width } = page.getSize()
    const textWidth = font.widthOfTextAtSize(label, size)
    page.drawText(label, {
      x: (width - textWidth) / 2,
      y: 12,
      size,
      font,
      color,
    })
  }

  return out.save()
}
