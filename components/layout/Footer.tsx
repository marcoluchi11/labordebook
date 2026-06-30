import Link from 'next/link'
import Image from 'next/image'
import { Mail, Globe } from 'lucide-react'
import { NewsletterSignup } from '@/components/newsletter/NewsletterSignup'

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.975.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.975.975-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.975-.975 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.756 0 8.332.014 7.052.072 5.197.157 3.355.673 2.014 2.014.673 3.355.157 5.197.072 7.052.014 8.332 0 8.756 0 12c0 3.244.014 3.668.072 4.948.085 1.855.601 3.697 1.942 5.038 1.341 1.341 3.183 1.857 5.038 1.942C8.332 23.986 8.756 24 12 24s3.668-.014 4.948-.072c1.855-.085 3.697-.601 5.038-1.942 1.341-1.341 1.857-3.183 1.942-5.038.058-1.28.072-1.704.072-4.948 0-3.244-.014-3.668-.072-4.948-.085-1.855-.601-3.697-1.942-5.038C20.645.673 18.803.157 16.948.072 15.668.014 15.244 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  )
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  )
}

function IconYoutube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

const SOCIAL = [
  { href: 'https://www.instagram.com/laborde.libreriayeditorial/', Icon: IconInstagram, label: 'Instagram' },
  { href: 'https://www.facebook.com/laborde.libros.editorial', Icon: IconFacebook, label: 'Facebook' },
  { href: 'https://www.youtube.com/@labordelibreriayeditorial', Icon: IconYoutube, label: 'YouTube' },
  { href: 'https://labordeeditor.com.ar/', Icon: Globe, label: 'Sitio web' },
  { href: 'mailto:labordelibreriayeditorial@gmail.com', Icon: Mail, label: 'labordelibreriayeditorial@gmail.com' },
]

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">

      {/* Newsletter — banda full-width */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="shrink-0">
              <p className="font-semibold text-gray-900 text-sm">Novedades y promociones</p>
              <p className="text-sm text-gray-500 mt-0.5">Enterate primero de libros nuevos y descuentos.</p>
            </div>
            <div className="sm:max-w-md w-full">
              <NewsletterSignup compact />
            </div>
          </div>
        </div>
      </div>

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

            <p className="font-semibold text-gray-900 text-sm mb-3 mt-6">Pagos y formatos</p>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Image src="/mercadopago-logo.svg" alt="MercadoPago" width={60} height={55} className="h-8 w-auto" />
              <Image src="/visa-logo.svg" alt="Visa" width={60} height={20} className="h-5 w-auto" />
              <Image src="/mastercard-logo.svg" alt="Mastercard" width={40} height={40} className="h-8 w-auto" />
              <Image src="/amex-logo.svg" alt="American Express" width={40} height={40} className="h-8 w-auto" />
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Formatos disponibles</p>
            <p className="text-sm text-gray-500 mt-1">PDF · EPUB</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-sm mb-3">Contacto y redes</p>
            <ul className="space-y-2">
              {SOCIAL.map(({ href, Icon, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    target={href.startsWith('mailto') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-gray-700 transition-colors" />
                    <span className="truncate">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>
        <p className="text-xs text-gray-400 pt-6 text-center">
          © 2025 Laborde Editorial · Todos los derechos reservados
        </p>
      </div>
    </footer>
  )
}
