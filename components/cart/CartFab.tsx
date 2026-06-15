'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/cart/CartContext'

export function CartFab() {
  const { items, mounted } = useCart()
  const count = mounted ? items.length : 0

  return (
    <Link
      href="/cart"
      aria-label={`Carrito (${count} artículos)`}
      className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-full shadow-lg hover:bg-gray-700 active:scale-95 transition-all duration-150"
    >
      <ShoppingCart className="h-4 w-4 flex-shrink-0" />
      {count > 0 && (
        <span className="text-sm font-semibold leading-none">{count}</span>
      )}
    </Link>
  )
}
