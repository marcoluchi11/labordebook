'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2, ShoppingCart as ShoppingCartIcon } from 'lucide-react'

export interface CartItem {
  id: string
  title: string
  author: string
  price: number
  coverUrl: string | null
}

interface ShoppingCartProps {
  items: CartItem[]
  onRemoveItem: (id: string) => void
  onCheckout: () => void
}

export function ShoppingCart({ items, onRemoveItem, onCheckout }: ShoppingCartProps) {
  const total = items.reduce((sum, item) => sum + item.price, 0)

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCartIcon className="h-6 w-6" />
          Tu carrito
        </CardTitle>
        <span className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'libro' : 'libros'}
        </span>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCartIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-base">Tu carrito está vacío.</p>
            <Link href="/" className="text-sm text-gray-900 underline underline-offset-2 mt-2 inline-block hover:text-gray-600">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border border-border p-3 rounded-lg">
                {/* Cover */}
                <div className="w-14 h-20 relative flex-shrink-0 rounded overflow-hidden bg-gray-100">
                  {item.coverUrl ? (
                    <Image
                      src={item.coverUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                      <span className="text-white text-xs font-bold opacity-60">
                        {item.title.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium leading-snug line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.author}</p>
                </div>

                {/* Price + remove */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="font-semibold text-base">${item.price.toLocaleString('es-AR')}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onRemoveItem(item.id)}
                    aria-label={`Quitar ${item.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <>
            <Separator className="my-6" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${total.toLocaleString('es-AR')}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Recibirás acceso por email después del pago.
            </p>
          </>
        )}
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          className="w-full h-12 text-base font-semibold"
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          Proceder al pago — ${total.toLocaleString('es-AR')}
        </Button>
      </CardFooter>
    </Card>
  )
}
