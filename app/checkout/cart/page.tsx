import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CartCheckoutForm } from '@/components/checkout/CartCheckoutForm'

interface Props {
  searchParams: Promise<{ bookIds?: string }>
}

export default async function CartCheckoutPage({ searchParams }: Props) {
  const { bookIds: bookIdsParam } = await searchParams
  if (!bookIdsParam) notFound()

  const bookIds = bookIdsParam.split(',').filter(Boolean)
  if (bookIds.length === 0) notFound()

  const supabase = await createClient()
  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, price, cover_url')
    .in('id', bookIds)
    .eq('is_published', true)

  if (!books || books.length === 0) notFound()

  const total = books.reduce((sum, b) => sum + b.price, 0)

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <Link href="/cart" className="text-sm text-gray-500 hover:text-gray-700 mb-8 inline-block">
        ← Volver al carrito
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Finalizar compra</h1>

      {/* Books summary */}
      <div className="space-y-3 mb-8">
        {books.map(book => (
          <div key={book.id} className="flex gap-3 bg-gray-50 rounded-lg p-3">
            {book.cover_url && (
              <div className="w-10 h-14 relative rounded overflow-hidden flex-shrink-0">
                <Image src={book.cover_url} alt={book.title} fill className="object-cover" sizes="40px" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm leading-snug">{book.title}</p>
              <p className="text-gray-500 text-xs">{book.author}</p>
            </div>
            <p className="text-gray-900 font-semibold text-sm flex-shrink-0">
              ${book.price.toLocaleString('es-AR')}
            </p>
          </div>
        ))}
        <div className="flex justify-between font-bold text-base pt-1 px-1">
          <span>Total</span>
          <span>${total.toLocaleString('es-AR')}</span>
        </div>
      </div>

      <CartCheckoutForm bookIds={books.map(b => b.id)} total={total} />
    </main>
  )
}
