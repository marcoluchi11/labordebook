import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getViewerLimiter, getClientIp } from '@/lib/ratelimit'
import { extractFirstPages } from '@/lib/preview/pdf'

interface Params {
  params: Promise<{ bookId: string }>
}

// Free preview: no auth/cookie required. Returns a public URL to a cached PDF
// that contains ONLY the first `preview_pages` pages of the book. The full
// book (books-private) is never exposed to the browser in preview mode.
export async function GET(request: NextRequest, { params }: Params) {
  const { bookId } = await params

  // Rate limit — endpoint is unauthenticated, keep abuse in check
  const ip = getClientIp(request)
  const { success } = await getViewerLimiter().limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
  }

  const supabase = createServiceRoleClient()

  const { data: book } = await supabase
    .from('books')
    .select('pdf_path, preview_pdf_url, preview_pages, is_published')
    .eq('id', bookId)
    .single()

  if (!book || !book.is_published || !book.pdf_path) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  // Cache path is versioned by page count so changing preview_pages regenerates
  const cachePath = `previews/${bookId}-${book.preview_pages}.pdf`

  function publicUrl(path: string): string {
    return supabase.storage.from('books-public').getPublicUrl(path).data.publicUrl
  }

  // Already generated for this page count → serve cached copy
  if (book.preview_pdf_url === cachePath) {
    return NextResponse.json({ url: publicUrl(cachePath) })
  }

  // Generate: download original, truncate to first N pages, cache in public bucket
  const { data: original, error: downloadError } = await supabase.storage
    .from('books-private')
    .download(book.pdf_path)

  if (downloadError || !original) {
    return NextResponse.json({ error: 'Error al generar la muestra' }, { status: 500 })
  }

  let previewBytes: Uint8Array
  try {
    const originalBytes = await original.arrayBuffer()
    previewBytes = await extractFirstPages(originalBytes, book.preview_pages)
  } catch {
    return NextResponse.json({ error: 'Error al generar la muestra' }, { status: 500 })
  }

  const { error: uploadError } = await supabase.storage
    .from('books-public')
    .upload(cachePath, previewBytes, { contentType: 'application/pdf', upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: 'Error al generar la muestra' }, { status: 500 })
  }

  // Persist the cache path (fire-and-forget, mirrors the watermark cache pattern)
  supabase.from('books').update({ preview_pdf_url: cachePath }).eq('id', bookId).then()

  return NextResponse.json({ url: publicUrl(cachePath) })
}
