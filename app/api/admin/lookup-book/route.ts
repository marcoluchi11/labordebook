import { NextRequest, NextResponse } from 'next/server'

const FIELDS = 'title,author_name,publisher,first_publish_year,number_of_pages_median,language,cover_i,subject'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json(null)

  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=1&fields=${FIELDS}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ebook-store/1.0' },
    next: { revalidate: 3600 },
  })

  if (!res.ok) return NextResponse.json(null)

  const data = await res.json()
  const doc = data.docs?.[0]
  if (!doc) return NextResponse.json(null)

  const lang = (doc.language as string[] | undefined)?.[0]
  const mappedLang = lang === 'spa' ? 'es' : lang === 'por' ? 'pt' : lang === 'eng' ? 'en' : undefined

  // Pick the shortest/most common publisher name (usually the real one, not a distributor)
  const publishers: string[] = doc.publisher ?? []
  const publisher = publishers.sort((a: string, b: string) => a.length - b.length)[0]

  const coverUrl = doc.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    : null

  return NextResponse.json({
    title: doc.title as string | undefined,
    author: (doc.author_name as string[] | undefined)?.[0],
    publisher,
    published_year: doc.first_publish_year as number | undefined,
    page_count: doc.number_of_pages_median as number | undefined,
    language: mappedLang,
    cover_url: coverUrl,
  })
}
