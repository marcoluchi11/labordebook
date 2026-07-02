import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PDFViewerWrapper } from '@/components/viewer/PDFViewerWrapper'

interface Props {
  params: Promise<{ bookId: string }>
}

// Free preview reader — no auth/cookie required. Only the first `preview_pages`
// pages are ever served (via /api/preview), so this route is safe to leave open.
export default async function ReadPreviewPage({ params }: Props) {
  const { bookId } = await params

  const supabase = await createClient()
  const { data: book } = await supabase
    .from('books')
    .select('title, author, slug')
    .eq('id', bookId)
    .eq('is_published', true)
    .single()

  if (!book) notFound()

  return (
    <>
      <PDFViewerWrapper bookId={bookId} bookTitle={book.title} preview bookSlug={book.slug} />
      <style>{`@media print { body { display: none !important; } }`}</style>
    </>
  )
}
