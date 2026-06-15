import JSZip from 'jszip'

export interface WatermarkData {
  buyerName: string
  buyerEmail: string
  purchaseId: string
  purchaseDate: string
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return email
  return `${user.slice(0, 3)}***@${domain}`
}

async function findOpfPath(zip: JSZip): Promise<string> {
  const container = zip.file('META-INF/container.xml')
  if (!container) throw new Error('EPUB inválido: falta META-INF/container.xml')

  const containerXml = await container.async('text')
  const match = containerXml.match(/full-path="([^"]+\.opf)"/)
  if (!match) throw new Error('EPUB inválido: no se encontró el path OPF')
  return match[1]
}

function injectOpfMetadata(opfContent: string, data: WatermarkData): string {
  const metaTags = [
    `<meta name="buyer-name" content="${data.buyerName}" />`,
    `<meta name="buyer-email" content="${maskEmail(data.buyerEmail)}" />`,
    `<meta name="purchase-id" content="#${data.purchaseId.slice(-8)}" />`,
    `<meta name="purchase-date" content="${data.purchaseDate}" />`,
  ].join('\n    ')

  // Inject before closing </metadata> tag
  return opfContent.replace('</metadata>', `    ${metaTags}\n  </metadata>`)
}

function buildWatermarkHtml(data: WatermarkData): string {
  return `<p style="font-size:0.7em;color:#aaa;text-align:center;margin:1em 0;">` +
    `Adquirido por ${data.buyerName} · Pedido #${data.purchaseId.slice(-8)} · ${data.purchaseDate}` +
    `</p>`
}

export async function watermarkEpub(
  originalBytes: ArrayBuffer,
  data: WatermarkData
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(originalBytes)

  // Inject metadata into OPF
  const opfPath = await findOpfPath(zip)
  const opfFile = zip.file(opfPath)
  if (!opfFile) throw new Error('EPUB inválido: no se encontró el archivo OPF')

  const opfContent = await opfFile.async('text')
  zip.file(opfPath, injectOpfMetadata(opfContent, data))

  // Inject visible watermark into the first HTML content file
  const htmlFiles = Object.keys(zip.files).filter(
    (f) => (f.endsWith('.html') || f.endsWith('.xhtml')) && !zip.files[f].dir
  )

  if (htmlFiles.length > 0) {
    const firstHtmlFile = zip.file(htmlFiles[0])
    if (firstHtmlFile) {
      const htmlContent = await firstHtmlFile.async('text')
      const watermarkHtml = buildWatermarkHtml(data)
      // Insert after <body> tag
      const modified = htmlContent.replace(/<body[^>]*>/, (match) => `${match}\n${watermarkHtml}`)
      zip.file(htmlFiles[0], modified)
    }
  }

  const result = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
  return result
}
