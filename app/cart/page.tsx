'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/cart/CartContext'
import { ShoppingCart } from '@/components/ui/shopping-cart'

export default function CartPage() {
  const { items, removeItem } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    if (items.length === 0) return
    const ids = items.map(i => i.id).join(',')
    router.push(`/checkout/cart?bookIds=${ids}`)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Seguir comprando
        </Link>
      </div>
      <ShoppingCart
        items={items}
        onRemoveItem={removeItem}
        onCheckout={handleCheckout}
      />
    </main>
  )
}
