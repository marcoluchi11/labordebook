import { Book } from '@/components/ui/book'
import Link from 'next/link'

const demoBooks = [
  {
    id: '1',
    title: 'El nombre del viento',
    author: 'Patrick Rothfuss',
    coverUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=320&h=480&fit=crop&auto=format',
    price: 1500,
  },
  {
    id: '2',
    title: 'Cien años de soledad',
    author: 'Gabriel García Márquez',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=320&h=480&fit=crop&auto=format',
    price: 1200,
  },
  {
    id: '3',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=320&h=480&fit=crop&auto=format',
    price: 1800,
  },
  {
    id: '6',
    title: 'El arte de la guerra',
    author: 'Sun Tzu',
    coverUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=320&h=480&fit=crop&auto=format',
    price: 800,
  },
  {
    id: '7',
    title: 'Atomic Habits',
    author: 'James Clear',
    coverUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=320&h=480&fit=crop&auto=format',
    price: 2000,
  },
  {
    id: '4',
    title: 'Introducción a la Programación Funcional',
    author: 'Marco García',
    coverUrl: null,
    price: 900,
  },
  {
    id: '5',
    title: 'Filosofía Contemporánea y sus corrientes',
    author: 'Ana Morales',
    coverUrl: null,
    price: 1100,
  },
  {
    id: '8',
    title: 'Economía para el Siglo XXI',
    author: 'Roberto Silva',
    coverUrl: null,
    price: 1400,
  },
  {
    id: '9',
    title: 'Mindfulness y Neurociencia',
    author: 'Carla Benítez',
    coverUrl: null,
    price: 950,
  },
  {
    id: '10',
    title: 'Física Cuántica sin Matemática',
    author: 'Diego Fontana',
    coverUrl: null,
    price: 1300,
  },
]

export default function DemoBooksPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo — Nuevo diseño de libros</h1>
        <p className="text-gray-500 text-sm">
          Previsualización del componente Book 3D. Pasá el mouse por encima para ver la animación.{' '}
          <Link href="/" className="underline hover:text-gray-900">
            Ver catálogo real →
          </Link>
        </p>
        <p className="text-gray-400 text-xs mt-3">
          Para volver al diseño anterior: cambiar el import en{' '}
          <code className="bg-gray-100 px-1 rounded">components/catalog/BookGrid.tsx</code>{' '}
          de <code className="bg-gray-100 px-1 rounded">BookCard</code> a{' '}
          <code className="bg-gray-100 px-1 rounded">BookCardLegacy</code>.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Con tapa (cover_url presente)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {demoBooks.filter(b => b.coverUrl).map(book => (
            <div key={book.id} className="block">
              <div className="flex justify-center mb-3">
                <Book
                  title={book.title}
                  author={book.author}
                  coverUrl={book.coverUrl!}
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
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Sin tapa (cover_url null → diseño genérico)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {demoBooks.filter(b => !b.coverUrl).map(book => (
            <div key={book.id} className="block">
              <div className="flex justify-center mb-3">
                <Book
                  title={book.title}
                  author={book.author}
                  variant="stripe"
                  width={{ sm: 130, lg: 160 }}
                />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm leading-snug">{book.title}</h3>
              <p className="text-gray-500 text-sm mt-0.5">{book.author}</p>
              <p className="text-gray-900 font-medium mt-1">${book.price.toLocaleString('es-AR')}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
