import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { Book } from '@/components/ui/book'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  // Must use service role client here — cookies() is not available at build time
  const supabase = createServiceRoleClient()
  const { data: books } = await supabase.from('books').select('slug').eq('is_published', true)
  return (books ?? []).map((b) => ({ slug: b.slug }))
}

export const revalidate = 60

export default async function BookPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!book) notFound()

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-8 inline-block">
        ← Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
        <div className="flex justify-center md:justify-start">
          <Book
            title={book.title}
            author={book.author}
            coverUrl={book.cover_url ?? undefined}
            variant={book.cover_url ? 'simple' : 'stripe'}
            width={240}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">{book.title}</h1>
          <p className="text-gray-500 mt-1 text-lg">{book.author}</p>

          {book.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {book.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-3xl font-bold text-gray-900 mt-6">
            ${book.price.toLocaleString('es-AR')}
          </p>

          <div className="flex gap-3 text-sm text-gray-500 mt-2">
            {book.page_count && <span>{book.page_count} páginas</span>}
            <span>{book.epub_path ? 'PDF + EPUB' : 'PDF'}</span>
            <span className="uppercase">{book.language}</span>
          </div>

          {book.description && (
            <p className="text-gray-600 mt-6 leading-relaxed">{book.description}</p>
          )}

          <Link
            href={`/checkout?bookId=${book.id}`}
            className="mt-8 inline-block bg-gray-900 text-white font-semibold px-8 py-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Comprar — ${book.price.toLocaleString('es-AR')}
          </Link>

          <p className="text-xs text-gray-400 mt-3">
            Recibirás acceso inmediato por email después del pago.
          </p>
        </div>
      </div>

      {book.long_description && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sobre el libro</h2>
          <div className="text-gray-600 leading-relaxed whitespace-pre-line">
            {book.long_description}
          </div>
        </div>
      )}
    </main>
  )
}
