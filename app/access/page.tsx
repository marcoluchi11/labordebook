import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { validateViewerCookie } from '@/lib/tokens'

interface Props {
  searchParams: Promise<{ t?: string; b?: string; f?: string }>
}

// Consumes access tokens from email links.
// viewer → sets HttpOnly cookie + redirects to /read/[bookId]
// pdf/epub → redirects to download API (token consumed there atomically alongside file serving)
export default async function AccessPage({ searchParams }: Props) {
  const { t: rawToken, b: bookId, f: format } = await searchParams

  if (!rawToken || !bookId || !format) notFound()

  if (format === 'viewer') {
    const result = await validateViewerCookie(rawToken)
    if (!result) {
      return (
        <main className="max-w-lg mx-auto px-4 py-20 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Acceso inválido</h1>
          <p className="text-gray-600">Este link de acceso no es válido o ha expirado.</p>
        </main>
      )
    }

    const cookieStore = await cookies()
    cookieStore.set(`viewer_token_${bookId}`, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })

    redirect(`/read/${bookId}`)
  }

  if (format === 'pdf' || format === 'epub') {
    // Pass token to download API — it handles atomic consumption + watermark + stream
    redirect(`/api/download?t=${encodeURIComponent(rawToken)}&f=${format}&b=${bookId}`)
  }

  notFound()
}
