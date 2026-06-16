import Link from 'next/link'
import Image from 'next/image'
import { CartIcon } from '@/components/cart/CartIcon'

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="Laborde Libros"
            width={36}
            height={36}
            className="rounded-sm opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-white font-bold text-sm tracking-[0.18em] uppercase group-hover:text-white/80 transition-colors">
              Laborde Editorial
            </span>
            <span className="text-white/35 text-[10px] tracking-widest uppercase">
              Venta de ebooks
            </span>
          </div>
        </Link>

        <CartIcon dark />

      </div>
    </header>
  )
}
