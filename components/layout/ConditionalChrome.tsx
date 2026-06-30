'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from './Header'
import { Footer } from './Footer'

export function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname.startsWith('/read/')) return <>{children}</>

  if (pathname.startsWith('/admin')) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
            <Link href="/">
              <Image src="/logo.png" alt="Laborde Libros" width={52} height={52} className="rounded-sm opacity-90" />
            </Link>
          </div>
        </header>
        {children}
      </>
    )
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
