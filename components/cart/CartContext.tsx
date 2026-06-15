'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface CartItem {
  id: string       // bookId
  slug: string
  title: string
  author: string
  price: number
  coverUrl: string | null
}

interface CartState {
  mounted: boolean
  items: CartItem[]
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
  isInCart: (id: string) => boolean
  mounted: boolean
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ mounted: false, items: [] })

  useEffect(() => {
    let items: CartItem[] = []
    try {
      const saved = localStorage.getItem('ebook-cart')
      if (saved) items = JSON.parse(saved)
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ mounted: true, items })
  }, [])

  useEffect(() => {
    if (!state.mounted) return
    try {
      localStorage.setItem('ebook-cart', JSON.stringify(state.items))
    } catch {}
  }, [state.items, state.mounted])

  const addItem = (item: CartItem) => {
    setState(prev => ({
      ...prev,
      items: prev.items.some(i => i.id === item.id) ? prev.items : [...prev.items, item],
    }))
  }

  const removeItem = (id: string) => {
    setState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }))
  }

  const clearCart = () => setState(prev => ({ ...prev, items: [] }))

  const isInCart = (id: string) => state.items.some(i => i.id === id)

  return (
    <CartContext.Provider value={{
      items: state.items,
      addItem,
      removeItem,
      clearCart,
      isInCart,
      mounted: state.mounted,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
