import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json(null)

  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1&printType=books`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return NextResponse.json(null)

  const data = await res.json()
  if (!data.items?.length) return NextResponse.json(null)

  const info = data.items[0].volumeInfo as Record<string, unknown>
  const links = info.imageLinks as Record<string, string> | undefined
  let coverUrl: string | null = links?.thumbnail ?? links?.smallThumbnail ?? null
  if (coverUrl) {
    coverUrl = coverUrl.replace('http://', 'https://').replace('zoom=1', 'zoom=3')
  }

  const rawDate = info.publishedDate as string | undefined
  const year = rawDate ? parseInt(rawDate.slice(0, 4)) : undefined

  return NextResponse.json({
    title: info.title as string | undefined,
    author: (info.authors as string[] | undefined)?.[0],
    publisher: info.publisher as string | undefined,
    published_year: year && !isNaN(year) ? year : undefined,
    page_count: info.pageCount as number | undefined,
    description: info.description as string | undefined,
    language: info.language as string | undefined,
    cover_url: coverUrl,
  })
}
