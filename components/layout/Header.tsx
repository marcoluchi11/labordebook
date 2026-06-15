import Link from 'next/link'
import { CartIcon } from '@/components/cart/CartIcon'

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        <Link href="/" className="flex flex-col leading-none gap-0.5 group">
          <span className="text-white font-bold text-sm tracking-[0.18em] uppercase group-hover:text-white/80 transition-colors">
            Laborde Editorial
          </span>
          <span className="text-white/35 text-[10px] tracking-widest uppercase">
            Venta de ebooks
          </span>
        </Link>

        <CartIcon dark />

      </div>
    </header>
  )
}
