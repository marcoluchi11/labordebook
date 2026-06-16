import { NextRequest, NextResponse } from 'next/server'
import { validateViewerCookie } from '@/lib/tokens'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const rawToken = searchParams.get('t')
  const bookId = searchParams.get('b')
  const format = searchParams.get('f')

  if (!rawToken || !bookId || !format) {
    return new NextResponse('Parámetros inválidos', { status: 400 })
  }

  if (format === 'viewer') {
    const result = await validateViewerCookie(rawToken)
    if (!result) {
      return new NextResponse(
        `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2>Acceso inválido</h2>
          <p>Este link de acceso no es válido o ha expirado.</p>
        </body></html>`,
        { status: 403, headers: { 'Content-Type': 'text/html' } }
      )
    }

    const response = NextResponse.redirect(`${origin}/read/${bookId}`)
    response.cookies.set(`viewer_token_${bookId}`, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
    return response
  }

  if (format === 'pdf' || format === 'epub') {
    return NextResponse.redirect(
      `${origin}/api/download?t=${encodeURIComponent(rawToken)}&f=${format}&b=${bookId}`
    )
  }

  return new NextResponse('Not found', { status: 404 })
}
