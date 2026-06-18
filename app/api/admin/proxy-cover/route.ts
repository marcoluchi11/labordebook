import { NextRequest, NextResponse } from 'next/server'

// Proxies Google Books cover images to avoid CORS restrictions in the browser
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  const ALLOWED = ['https://books.google.com/', 'https://covers.openlibrary.org/']
  if (!url || !ALLOWED.some((prefix) => url.startsWith(prefix))) {
    return new NextResponse('URL no permitida', { status: 400 })
  }

  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new NextResponse('Error al obtener imagen', { status: 502 })
  }
}
