import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart/CartContext'
import { CartFab } from '@/components/cart/CartFab'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'] })

export const metadata: Metadata = {
  title: 'Laborde Editorial',
  description: 'Venta de ebooks con acceso inmediato. Leé online o descargá en PDF y EPUB.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`h-full antialiased ${roboto.className}`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <CartProvider>
          <Header />
          {children}
          <Footer />
          <CartFab />
        </CartProvider>
      </body>
    </html>
  )
}
