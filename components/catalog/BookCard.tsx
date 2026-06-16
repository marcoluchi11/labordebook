import Link from 'next/link'
import { Book } from '@/components/ui/book'
import { AddToCartButton } from '@/components/catalog/AddToCartButton'
import type { Database } from '@/lib/supabase/types'

type BookRow = Database['public']['Tables']['books']['Row']

interface BookCardProps {
  book: BookRow
}

export function BookCard({ book }: BookCardProps) {
  const cartItem = {
    id: book.id,
    slug: book.slug,
    title: book.title,
    author: book.author,
    price: book.price,
    coverUrl: book.cover_url,
  }

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <Link href={`/books/${book.slug}`} className="group block flex-1">
        <div className="flex justify-center items-center bg-gray-50 py-8 px-4 min-h-[220px]">
          <Book
            title={book.title}
            author={book.author}
            coverUrl={book.cover_url ?? undefined}
            variant={book.cover_url ? 'simple' : 'stripe'}
            width={{ sm: 140, lg: 170 }}
          />
        </div>
        <div className="px-4 pt-3 pb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:underline line-clamp-2">
            {book.title}
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">{book.author}</p>
          <p className="text-gray-900 font-bold mt-2 text-base">
            ${book.price.toLocaleString('es-AR')}
          </p>
        </div>
      </Link>
      <div className="px-4 pb-4 pt-2">
        <AddToCartButton book={cartItem} compact />
      </div>
    </div>
  )
}
