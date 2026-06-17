import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b border-gray-200">

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image src="/logo.png" alt="Laborde Libros" width={32} height={32} className="rounded-sm" />
              <p className="font-semibold text-gray-900 text-sm tracking-wide uppercase">Laborde Editorial</p>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
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
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Image src="/mercadopago-logo.svg" alt="MercadoPago" width={60} height={55} className="h-8 w-auto" />
              <Image src="/visa-logo.svg" alt="Visa" width={60} height={20} className="h-5 w-auto" />
              <Image src="/mastercard-logo.svg" alt="Mastercard" width={40} height={40} className="h-8 w-auto" />
              <Image src="/amex-logo.svg" alt="American Express" width={40} height={40} className="h-8 w-auto" />
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Formatos disponibles</p>
            <p className="text-sm text-gray-500 mt-1">PDF · EPUB</p>
          </div>

        </div>
        <p className="text-xs text-gray-400 pt-6 text-center">
          © 2025 Laborde Editorial · Todos los derechos reservados
        </p>
      </div>
    </footer>
  )
}
