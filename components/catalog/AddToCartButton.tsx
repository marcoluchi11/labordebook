'use client'

import Link from 'next/link'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart, type CartItem } from '@/components/cart/CartContext'

interface Props {
  book: CartItem
  compact?: boolean
}

export function AddToCartButton({ book, compact = false }: Props) {
  const { addItem, removeItem, isInCart, mounted } = useCart()
  const inCart = mounted && isInCart(book.id)

  if (compact) {
    if (!mounted) {
      return (
        <button disabled className="w-full inline-flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg opacity-70 cursor-not-allowed">
          <ShoppingCart className="h-3.5 w-3.5" />
          Agregar
        </button>
      )
    }
    if (inCart) {
      return (
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-3 py-2 rounded-lg">
            <Check className="h-3.5 w-3.5" />
            En el carrito
          </div>
          <button onClick={() => removeItem(book.id)} className="text-gray-300 hover:text-red-400 transition-colors text-xs">
            Quitar
          </button>
        </div>
      )
    }
    return (
      <button
        onClick={() => addItem(book)}
        className="w-full inline-flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        Agregar al carrito
      </button>
    )
  }

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
