import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b border-gray-200">

          <div>
            <p className="font-semibold text-gray-900 text-sm">Librería</p>
            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
              Ebooks con acceso inmediato.<br />
              Comprá, pagá y leé en minutos.
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-sm mb-3">Navegación</p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-gray-900 transition-colors">Catálogo</Link>
              </li>
              <li>
                <Link href="/#como-funciona" className="hover:text-gray-900 transition-colors">¿Cómo funciona?</Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-gray-900 transition-colors">Carrito</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-sm mb-3">Pagos y formatos</p>
            <p className="text-sm text-gray-500">
              Pagos seguros con{' '}
              <span className="font-medium text-gray-700">MercadoPago</span>
            </p>
            <p className="text-xs text-gray-400 mt-3 uppercase tracking-wider">Formatos disponibles</p>
            <p className="text-sm text-gray-500 mt-1">PDF · EPUB</p>
          </div>

        </div>
        <p className="text-xs text-gray-400 pt-6 text-center">
          © 2025 Librería · Todos los derechos reservados
        </p>
      </div>
    </footer>
  )
}
