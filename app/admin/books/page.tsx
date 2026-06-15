import Link from 'next/link'
import { createServiceRoleClient } from '@/lib/supabase/server'

export default async function AdminBooksPage() {
  const supabase = createServiceRoleClient()
  const { data: books } = await supabase
    .from('books')
    .select('id, slug, title, author, price, is_published, epub_path')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Libros</h1>
        <Link
          href="/admin/books/new"
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          + Agregar libro
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Libro</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Precio</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Formatos</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(books ?? []).map((b) => (
              <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{b.title}</p>
                  <p className="text-gray-400 text-xs">{b.author}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  ${Number(b.price).toLocaleString('es-AR')}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {b.epub_path ? 'PDF + EPUB' : 'PDF'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.is_published ? 'Publicado' : 'Borrador'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/books/${b.id}`} className="text-gray-400 hover:text-gray-700 text-xs">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(books ?? []).length === 0 && (
          <p className="text-center text-gray-400 py-12">No hay libros aún.</p>
        )}
      </div>
    </div>
  )
}
