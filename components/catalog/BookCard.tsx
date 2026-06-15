import Link from 'next/link'
import { Book } from '@/components/ui/book'
import type { Database } from '@/lib/supabase/types'

type BookRow = Database['public']['Tables']['books']['Row']

interface BookCardProps {
  book: BookRow
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book.slug}`} className="group block">
      <div className="flex justify-center mb-3">
        <Book
          title={book.title}
          author={book.author}
          coverUrl={book.cover_url ?? undefined}
          variant={book.cover_url ? "simple" : "stripe"}
          width={{ sm: 130, lg: 160 }}
        />
      </div>
      <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:underline">
        {book.title}
      </h3>
      <p className="text-gray-500 text-sm mt-0.5">{book.author}</p>
      <p className="text-gray-900 font-medium mt-1">
        ${book.price.toLocaleString('es-AR')}
      </p>
    </Link>
  )
}
