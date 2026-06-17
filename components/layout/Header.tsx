import Link from 'next/link'
import Image from 'next/image'
import { CartIcon } from '@/components/cart/CartIcon'

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        <Link href="/" className="group">
          <Image
            src="/logo.png"
            alt="Laborde Libros"
            width={52}
            height={52}
            className="rounded-sm opacity-90 group-hover:opacity-100 transition-opacity"
          />
        </Link>

        <CartIcon dark />

      </div>
    </header>
  )
}
