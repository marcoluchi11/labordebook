'use client'

import Link from 'next/link'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart, type CartItem } from '@/components/cart/CartContext'

interface Props {
  book: CartItem
}

export function AddToCartButton({ book }: Props) {
  const { addItem, removeItem, isInCart, mounted } = useCart()
  const inCart = mounted && isInCart(book.id)

  if (!mounted) {
    return (
      <button
        disabled
        className="mt-8 inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-8 py-4 rounded-lg opacity-70 cursor-not-allowed"
      >
        <ShoppingCart className="h-5 w-5" />
        Agregar al carrito
      </button>
    )
  }

  if (inCart) {
    return (
      <div className="mt-8 flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 font-semibold px-8 py-4 rounded-lg">
          <Check className="h-5 w-5" />
          En el carrito
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/cart" className="text-gray-900 font-medium underline underline-offset-2 hover:text-gray-600">
            Ver carrito →
          </Link>
          <button
            onClick={() => removeItem(book.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            Quitar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => addItem(book)}
      className="mt-8 inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-8 py-4 rounded-lg hover:bg-gray-700 transition-colors"
    >
      <ShoppingCart className="h-5 w-5" />
      Agregar al carrito
    </button>
  )
}
