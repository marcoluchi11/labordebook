import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Auth check
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createServiceRoleClient()
  const { data: adminUser } = await supabase
    .from('admin_users').select('id').eq('id', user.id).single()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { hasPdf, hasEpub, hasCover, bookId } = await request.json()
  const fileId = bookId ?? crypto.randomUUID()

  const result: Record<string, string> = { fileId }

  if (hasPdf) {
    const pdfPath = `originals/${fileId}/book.pdf`
    const { data } = await supabase.storage
      .from('books-private')
      .createSignedUploadUrl(pdfPath)
    if (data) {
      result.pdfUploadUrl = data.signedUrl
      result.pdfPath = pdfPath
    }
  }

  if (hasEpub) {
    const epubPath = `originals/${fileId}/book.epub`
    const { data } = await supabase.storage
      .from('books-private')
      .createSignedUploadUrl(epubPath)
    if (data) {
      result.epubUploadUrl = data.signedUrl
      result.epubPath = epubPath
    }
  }

  if (hasCover) {
    const coverPath = `covers/${fileId}.jpg`
    const { data } = await supabase.storage
      .from('books-public')
      .createSignedUploadUrl(coverPath)
    if (data) {
      result.coverUploadUrl = data.signedUrl
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      result.coverUrl = `${supabaseUrl}/storage/v1/object/public/books-public/${coverPath}`
    }
  }

  return NextResponse.json(result)
}
