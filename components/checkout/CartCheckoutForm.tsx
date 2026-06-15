'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useCart } from '@/components/cart/CartContext'

const schema = z.object({
  name: z.string().min(2, 'Ingresá tu nombre completo'),
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

interface Props {
  bookIds: string[]
  total: number
}

export function CartCheckoutForm({ bookIds, total }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { clearCart } = useCart()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookIds, buyerName: data.name, buyerEmail: data.email }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Error al procesar el pago')
        return
      }

      clearCart()
      window.location.assign(json.initPoint)
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre completo
        </label>
        <input
          {...register('name')}
          type="text"
          placeholder="Juan García"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          placeholder="juan@gmail.com"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        <p className="text-xs text-gray-400 mt-1">
          Te enviaremos el acceso a los libros a este email.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 text-white font-semibold py-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Redirigiendo a MercadoPago...' : `Pagar $${total.toLocaleString('es-AR')}`}
      </button>

      <p className="text-xs text-center text-gray-400">
        Serás redirigido a MercadoPago para completar el pago de forma segura.
      </p>
    </form>
  )
}
