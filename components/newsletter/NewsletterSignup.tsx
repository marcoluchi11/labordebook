'use client'

import { useState } from 'react'

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email,   setEmail]   = useState('')
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')

    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setStatus(res.ok ? 'ok' : 'error')
  }

  if (status === 'ok') {
    return (
      <p className="text-sm text-green-700 font-medium">
        ¡Listo! Te avisamos cuando haya novedades.
      </p>
    )
  }

  return (
    <div>
      {!compact && (
        <>
          <p className="font-semibold text-gray-900 text-sm mb-3">Novedades</p>
          <p className="text-sm text-gray-500 mb-3">
            Suscribite para recibir alertas de libros nuevos y promociones.
          </p>
        </>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 shrink-0"
        >
          {status === 'loading' ? '…' : 'Suscribirse'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-red-500 mt-1">Algo salió mal. Intentá de nuevo.</p>
      )}
    </div>
  )
}
