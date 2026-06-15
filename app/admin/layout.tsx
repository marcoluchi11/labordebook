import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <nav className="w-48 bg-gray-900 text-white flex flex-col py-6 px-3 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-4">
          Admin
        </p>
        <Link href="/admin" className="px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors mb-1">
          Dashboard
        </Link>
        <Link href="/admin/books" className="px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors mb-1">
          Libros
        </Link>
        <Link href="/admin/purchases" className="px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors mb-1">
          Ventas
        </Link>
        <div className="mt-auto">
          <Link href="/" className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors block">
            Ver tienda →
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
