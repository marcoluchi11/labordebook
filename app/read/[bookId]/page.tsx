import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PDFViewerWrapper } from '@/components/viewer/PDFViewerWrapper'
import { validateViewerCookie } from '@/lib/tokens'
import { createServiceRoleClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ bookId: string }>
}

export default async function ReadPage({ params }: Props) {
  const { bookId } = await params

  // Validate viewer cookie server-side before rendering
  const cookieStore = await cookies()
  const rawToken = cookieStore.get(`viewer_token_${bookId}`)?.value

  if (!rawToken) {
    redirect(`/?error=no-access`)
  }

  const result = await validateViewerCookie(rawToken)
  if (!result || result.bookId !== bookId) {
    redirect(`/?error=no-access`)
  }

  // Fetch book title for the header
  const supabase = createServiceRoleClient()
  const { data: book } = await supabase
    .from('books')
    .select('title, author')
    .eq('id', bookId)
    .single()

  return (
    <>
      <PDFViewerWrapper bookId={bookId} bookTitle={book?.title ?? undefined} />
      <style>{`@media print { body { display: none !important; } }`}</style>
    </>
  )
}
