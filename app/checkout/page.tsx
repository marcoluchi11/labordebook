import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'

interface Props {
  searchParams: Promise<{ bookId?: string }>
}

export default async function CheckoutPage({ searchParams }: Props) {
  const { bookId } = await searchParams
  if (!bookId) notFound()

  const supabase = await createClient()
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .eq('is_published', true)
    .single()

  if (!book) notFound()

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Finalizar compra</h1>

      <div className="flex gap-4 bg-gray-50 rounded-lg p-4 mb-8">
        {book.cover_url && (
          <div className="w-16 h-24 relative rounded overflow-hidden flex-shrink-0">
            <Image src={book.cover_url} alt={book.title} fill className="object-cover" />
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{book.title}</p>
          <p className="text-gray-500 text-sm">{book.author}</p>
          <p className="text-gray-900 font-bold mt-2">${book.price.toLocaleString('es-AR')}</p>
        </div>
      </div>

      <CheckoutForm book={book} />
    </main>
  )
}
