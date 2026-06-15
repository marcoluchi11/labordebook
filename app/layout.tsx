import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Librería — Ebooks',
  description: 'Comprá y leé ebooks de forma segura.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}
