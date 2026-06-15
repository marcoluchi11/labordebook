import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { hashToken } from '@/lib/tokens'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getViewerLimiter, getClientIp } from '@/lib/ratelimit'

interface Params {
  params: Promise<{ bookId: string }>
}

export async function GET(request: NextRequest, { params }: Params) {
  const { bookId } = await params

  // Rate limit
  const ip = getClientIp(request)
  const limiter = getViewerLimiter()
  const { success } = await limiter.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
  }

  // Read viewer cookie
  const cookieStore = await cookies()
  const rawToken = cookieStore.get(`viewer_token_${bookId}`)?.value
  if (!rawToken) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const hash = hashToken(rawToken)
  const supabase = createServiceRoleClient()

  // Validate token and get the book's pdf_path
  const { data } = await supabase
    .from('download_tokens')
    .select('purchase_id, revoked, expires_at, purchases!inner(book_id, books!inner(pdf_path))')
    .eq('token_hash', hash)
    .eq('format', 'viewer')
    .eq('revoked', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  const purchase = data.purchases as unknown as { book_id: string; books: { pdf_path: string } }
  if (purchase.book_id !== bookId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Generate a short-lived signed URL (5 minutes) — PDF.js will load via this URL
  const { data: signedUrlData, error } = await supabase.storage
    .from('books-private')
    .createSignedUrl(purchase.books.pdf_path, 300) // 5 minutes

  if (error || !signedUrlData) {
    return NextResponse.json({ error: 'Error al generar acceso' }, { status: 500 })
  }

  return NextResponse.json({ url: signedUrlData.signedUrl })
}
