import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { Book } from '@/components/ui/book'
import { AddToCartButton } from '@/components/catalog/AddToCartButton'
import { BookOpen, Globe, Building2, Calendar, FileText, BookMarked, BookOpenText } from 'lucide-react'

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

  const hasDetails = book.page_count || book.publisher || book.published_year
  const langLabel = book.language === 'es' ? 'Español' : book.language === 'en' ? 'Inglés' : book.language === 'pt' ? 'Portugués' : book.language

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

          <p className="text-3xl font-bold text-gray-900 mt-5">
            ${book.price.toLocaleString('es-AR')}
          </p>

          {book.description && (
            <p className="text-gray-600 mt-4 leading-relaxed">{book.description}</p>
          )}

          {/* Formats available */}
          <div className="mt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Formatos disponibles</p>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                <FileText className="h-3.5 w-3.5" />
                PDF
              </span>
              {book.epub_path && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                  <BookMarked className="h-3.5 w-3.5" />
                  EPUB
                </span>
              )}
            </div>
          </div>

          {hasDetails && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200 text-center text-sm">
              {book.page_count && (
                <div className="bg-white px-3 py-4 flex flex-col items-center gap-1.5">
                  <BookOpen className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                  <span className="text-xs text-gray-400 leading-tight">Número de páginas</span>
                  <span className="font-semibold text-gray-900">{book.page_count} págs.</span>
                </div>
              )}
              <div className="bg-white px-3 py-4 flex flex-col items-center gap-1.5">
                <Globe className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                <span className="text-xs text-gray-400 leading-tight">Idioma</span>
                <span className="font-semibold text-gray-900">{langLabel}</span>
              </div>
              {book.publisher && (
                <div className="bg-white px-3 py-4 flex flex-col items-center gap-1.5">
                  <Building2 className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                  <span className="text-xs text-gray-400 leading-tight">Editorial</span>
                  <span className="font-semibold text-gray-900">{book.publisher}</span>
                </div>
              )}
              {book.published_year && (
                <div className="bg-white px-3 py-4 flex flex-col items-center gap-1.5">
                  <Calendar className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                  <span className="text-xs text-gray-400 leading-tight">Publicación</span>
                  <span className="font-semibold text-gray-900">{book.published_year}</span>
                </div>
              )}
            </div>
          )}

          <AddToCartButton
            book={{
              id: book.id,
              slug: book.slug,
              title: book.title,
              author: book.author,
              price: book.price,
              coverUrl: book.cover_url,
            }}
          />

          <Link
            href={`/read/preview/${book.id}`}
            className="mt-3 inline-flex items-center gap-2 text-gray-700 font-medium border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BookOpenText className="h-4 w-4" />
            Leer muestra gratis
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
