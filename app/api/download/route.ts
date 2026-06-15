import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { consumeToken, hashToken } from '@/lib/tokens'
import { watermarkPdf } from '@/lib/watermark/pdf'
import { watermarkEpub } from '@/lib/watermark/epub'
import { getDownloadLimiter, getClientIp } from '@/lib/ratelimit'

// Validates file magic bytes to prevent serving malicious uploads
function isPdf(bytes: Uint8Array): boolean {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 // %PDF
}

function isZip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04 // PK\x03\x04
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawToken = searchParams.get('t')
  const format = searchParams.get('f') as 'pdf' | 'epub' | null
  const bookId = searchParams.get('b')

  if (!rawToken || !format || !bookId || !['pdf', 'epub'].includes(format)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  // Rate limit
  const ip = getClientIp(request)
  const { success } = await getDownloadLimiter().limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Demasiadas descargas. Esperá unos minutos.' }, { status: 429 })
  }

  // Atomically consume the download token
  let purchaseId: string
  try {
    const result = await consumeToken(rawToken, format)
    purchaseId = result.purchaseId
  } catch {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;text-align:center;padding:40px">
        <h2>Link expirado</h2>
        <p>Este link de descarga ya fue utilizado o expiró.</p>
        <p>Revisá tu email para obtener un nuevo link.</p>
      </body></html>`,
      { status: 410, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const supabase = createServiceRoleClient()

  // Fetch purchase + book info
  const { data: purchase } = await supabase
    .from('purchases')
    .select('id, buyer_name, buyer_email, confirmed_at, books!inner(id, title, pdf_path, epub_path)')
    .eq('id', purchaseId)
    .eq('payment_status', 'approved')
    .single()

  if (!purchase) {
    return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
  }

  const book = purchase.books as unknown as {
    id: string
    title: string
    pdf_path: string
    epub_path: string | null
  }

  if (format === 'epub' && !book.epub_path) {
    return NextResponse.json({ error: 'EPUB no disponible para este libro' }, { status: 404 })
  }

  // Check watermark cache
  const { data: cached } = await supabase
    .from('watermark_cache')
    .select('storage_path')
    .eq('purchase_id', purchaseId)
    .eq('format', format)
    .gt('expires_at', new Date().toISOString())
    .single()

  let fileBytes: Uint8Array

  if (cached) {
    // Serve from cache
    const { data: cachedData, error: downloadError } = await supabase.storage
      .from('watermarks')
      .download(cached.storage_path)

    if (downloadError || !cachedData) {
      // Cache miss — fall through to regenerate
    } else {
      fileBytes = new Uint8Array(await cachedData.arrayBuffer())
    }
  }

  if (!fileBytes!) {
    // Generate watermarked file
    const originalPath = format === 'pdf' ? book.pdf_path : book.epub_path!
    const { data: originalData, error: originalError } = await supabase.storage
      .from('books-private')
      .download(originalPath)

    if (originalError || !originalData) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 500 })
    }

    const originalBytes = await originalData.arrayBuffer()
    const originalArr = new Uint8Array(originalBytes)

    // Validate magic bytes
    if (format === 'pdf' && !isPdf(originalArr)) {
      return NextResponse.json({ error: 'Archivo inválido' }, { status: 500 })
    }
    if (format === 'epub' && !isZip(originalArr)) {
      return NextResponse.json({ error: 'Archivo inválido' }, { status: 500 })
    }

    const watermarkData = {
      buyerName: purchase.buyer_name,
      buyerEmail: purchase.buyer_email,
      purchaseId: purchase.id,
      purchaseDate: new Date(purchase.confirmed_at ?? Date.now()).toLocaleDateString('es-AR'),
    }

    fileBytes = format === 'pdf'
      ? await watermarkPdf(originalBytes, watermarkData)
      : await watermarkEpub(originalBytes, watermarkData)

    // Store in cache (fire and forget — don't block the response)
    const cachePath = `${format}/${purchaseId}.${format}`
    supabase.storage
      .from('watermarks')
      .upload(cachePath, fileBytes, { contentType: format === 'pdf' ? 'application/pdf' : 'application/epub+zip', upsert: true })
      .then(() => {
        return supabase.from('watermark_cache').upsert({
          purchase_id: purchaseId,
          format,
          storage_path: cachePath,
          file_size_bytes: fileBytes.byteLength,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
      })
      .catch((err) => console.error('Cache write error', err))
  }

  const safeTitle = book.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase()
  const filename = `${safeTitle}.${format}`
  const contentType = format === 'pdf' ? 'application/pdf' : 'application/epub+zip'

  return new NextResponse(Buffer.from(fileBytes), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(fileBytes.byteLength),
      'Cache-Control': 'no-store, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
