'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useCart } from '@/components/cart/CartContext'

const schema = z.object({
  name: z.string().min(2, 'Ingresá tu nombre completo'),
  email: z.string().email('Email inválido'),
  emailConfirm: z.string().email('Email inválido'),
  isGift: z.boolean(),
  recipientName: z.string().optional(),
  recipientEmail: z.string().optional(),
  recipientEmailConfirm: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.email !== data.emailConfirm) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Los emails no coinciden', path: ['emailConfirm'] })
  }
  if (data.isGift) {
    if (!data.recipientName || data.recipientName.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ingresá el nombre del destinatario', path: ['recipientName'] })
    }
    if (!data.recipientEmail || !z.string().email().safeParse(data.recipientEmail).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Email del destinatario inválido', path: ['recipientEmail'] })
    }
    if (data.recipientEmail !== data.recipientEmailConfirm) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Los emails no coinciden', path: ['recipientEmailConfirm'] })
    }
  }
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isGift: false },
  })

  const isGift = watch('isGift')

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookIds,
          buyerName: data.name,
          buyerEmail: data.email,
          isGift: data.isGift,
          recipientEmail: data.isGift ? data.recipientEmail : undefined,
          recipientName: data.isGift ? data.recipientName : undefined,
        }),
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
          Tu nombre completo
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
          Tu email
        </label>
        <input
          {...register('email')}
          type="email"
          placeholder="juan@gmail.com"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmá tu email
        </label>
        <input
          {...register('emailConfirm')}
          type="email"
          placeholder="juan@gmail.com"
          onPaste={(e) => e.preventDefault()}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        {errors.emailConfirm
          ? <p className="text-red-500 text-sm mt-1">{errors.emailConfirm.message}</p>
          : <p className="text-xs text-gray-400 mt-1">{isGift ? 'Te enviaremos la confirmación a este email.' : 'Te enviaremos el acceso a los libros a este email.'}</p>
        }
      </div>

      {/* Gift toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          {...register('isGift')}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 accent-gray-900"
        />
        <span className="text-sm text-gray-700">Comprar como regalo para otra persona</span>
      </label>

      {/* Gift recipient fields */}
      {isGift && (
        <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-4">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Datos del destinatario</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del destinatario
            </label>
            <input
              {...register('recipientName')}
              type="text"
              placeholder="María García"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {errors.recipientName && <p className="text-red-500 text-sm mt-1">{errors.recipientName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email del destinatario
            </label>
            <input
              {...register('recipientEmail')}
              type="email"
              placeholder="maria@gmail.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {errors.recipientEmail && <p className="text-red-500 text-sm mt-1">{errors.recipientEmail.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmá el email del destinatario
            </label>
            <input
              {...register('recipientEmailConfirm')}
              type="email"
              placeholder="maria@gmail.com"
              onPaste={(e) => e.preventDefault()}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {errors.recipientEmailConfirm
              ? <p className="text-red-500 text-sm mt-1">{errors.recipientEmailConfirm.message}</p>
              : <p className="text-xs text-gray-500 mt-1">El acceso a los libros le llegará a este email.</p>
            }
          </div>
        </div>
      )}

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
