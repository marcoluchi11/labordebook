'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/cart/CartContext'

export function CartIcon() {
  const { items, mounted } = useCart()
  const count = mounted ? items.length : 0

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
      aria-label={`Carrito (${count} items)`}
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
          {count}
        </span>
      )}
    </Link>
  )
}
