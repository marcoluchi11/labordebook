import { Book } from '@/components/ui/book'
import Link from 'next/link'

const demoBooks = [
  {
    id: '1',
    title: 'Who Moved My Cheese?',
    author: 'Spencer Johnson',
    coverUrl: 'https://covers.openlibrary.org/b/id/258839-L.jpg',
    price: 27000,
  },
  {
    id: '2',
    title: 'Never Split the Difference',
    author: 'Chris Voss',
    coverUrl: 'https://covers.openlibrary.org/b/id/8365942-L.jpg',
    price: 22000,
  },
  {
    id: '3',
    title: 'The 5 Types of Wealth',
    author: 'Sahil Bloom',
    coverUrl: 'https://covers.openlibrary.org/b/id/14857440-L.jpg',
    price: 25000,
  },
]

export default function DemoBooksPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo — Diseño de libros</h1>
        <p className="text-gray-500 text-sm">
          Previsualización del componente Book 3D. Pasá el mouse por encima para ver la animación.{' '}
          <Link href="/" className="underline hover:text-gray-900">
            Ver catálogo real →
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {demoBooks.map(book => (
          <div key={book.id} className="block">
            <div className="flex justify-center mb-3">
              <Book
                title={book.title}
                author={book.author}
                coverUrl={book.coverUrl}
                variant="simple"
                width={{ sm: 130, lg: 160 }}
              />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{book.title}</h3>
            <p className="text-gray-500 text-sm mt-0.5">{book.author}</p>
            <p className="text-gray-900 font-medium mt-1">${book.price.toLocaleString('es-AR')}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
