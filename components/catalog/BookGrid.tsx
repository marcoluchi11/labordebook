import { BookCard } from './BookCard'
import type { Database } from '@/lib/supabase/types'

type Book = Database['public']['Tables']['books']['Row']

interface BookGridProps {
  books: Book[]
}

export function BookGrid({ books }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">No hay libros disponibles aún.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}
