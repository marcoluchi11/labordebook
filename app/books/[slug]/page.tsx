import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { Book } from '@/components/ui/book'
import { AddToCartButton } from '@/components/catalog/AddToCartButton'
import { getBookMeta } from '@/lib/book-metadata'
import { BookOpen, Globe, Building2, Calendar } from 'lucide-react'

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

  const meta = getBookMeta(book.slug)

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

          {meta && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200 text-center text-sm">
              <div className="bg-white px-3 py-4 flex flex-col items-center gap-1.5">
                <BookOpen className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                <span className="text-xs text-gray-400 leading-tight">Número de páginas</span>
                <span className="font-semibold text-gray-900">{meta.pages} págs.</span>
              </div>
              <div className="bg-white px-3 py-4 flex flex-col items-center gap-1.5">
                <Globe className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                <span className="text-xs text-gray-400 leading-tight">Idioma</span>
                <span className="font-semibold text-gray-900">{book.language === 'es' ? 'Español' : book.language === 'en' ? 'Inglés' : book.language}</span>
              </div>
              <div className="bg-white px-3 py-4 flex flex-col items-center gap-1.5">
                <Building2 className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                <span className="text-xs text-gray-400 leading-tight">Editorial</span>
                <span className="font-semibold text-gray-900">{meta.publisher}</span>
              </div>
              <div className="bg-white px-3 py-4 flex flex-col items-center gap-1.5">
                <Calendar className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                <span className="text-xs text-gray-400 leading-tight">Fecha de publicación</span>
                <span className="font-semibold text-gray-900">{meta.publishedYear}</span>
              </div>
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
