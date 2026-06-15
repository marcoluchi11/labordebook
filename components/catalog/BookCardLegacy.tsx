import Image from 'next/image'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/types'

type Book = Database['public']['Tables']['books']['Row']

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book.slug}`} className="group block">
      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-100 mb-3">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-br from-gray-700 to-gray-900">
            <span className="text-white font-semibold text-sm leading-tight">{book.title}</span>
          </div>
        )}
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
