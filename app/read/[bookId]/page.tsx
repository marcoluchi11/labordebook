import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen bg-gray-900">
      {/* Minimal header */}
      <header className="bg-gray-800 px-4 py-3 flex items-center justify-between no-print">
        <Link href="/" className="text-gray-400 hover:text-white text-sm">
          ← Librería
        </Link>
        {book && (
          <div className="flex-1 text-center min-w-0 px-2">
            <p className="text-white text-sm font-medium truncate">{book.title}</p>
            <p className="text-gray-400 text-xs truncate">{book.author}</p>
          </div>
        )}
        <div className="w-16" />
      </header>

      <main className="py-2 px-2">
        <PDFViewerWrapper bookId={bookId} />
      </main>

      {/* Invisible print blocker */}
      <style>{`@media print { body { display: none !important; } }`}</style>
    </div>
  )
}
