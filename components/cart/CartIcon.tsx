'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/cart/CartContext'

export function CartIcon({ dark = false }: { dark?: boolean }) {
  const { items, mounted } = useCart()
  const count = mounted ? items.length : 0

  return (
    <Link
      href="/cart"
      aria-label={`Carrito (${count} items)`}
      className={`relative inline-flex items-center gap-1.5 transition-colors ${
        dark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className={`absolute -top-1.5 -right-1.5 text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none ${
          dark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
        }`}>
          {count}
        </span>
      )}
    </Link>
  )
}
