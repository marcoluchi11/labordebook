'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'

export function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith('/read/')) return <>{children}</>
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
