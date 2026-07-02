'use client'

import { useState } from 'react'

interface Book { id: string; title: string }

interface Props {
  books: Book[]
  totalSubscribers: number
}

export function NewsletterSendForm({ books, totalSubscribers }: Props) {
  const [subject,  setSubject]  = useState('')
  const [bookId,   setBookId]   = useState('')
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [result,   setResult]   = useState<{ sent: number; failed: number } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || totalSubscribers === 0) return
    setStatus('loading')
    setResult(null)

    const res = await fetch('/api/admin/newsletter/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, bookId: bookId || undefined }),
    })

    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setStatus('ok')
      setResult({ sent: data.sent, failed: data.failed })
      setSubject('')
      setBookId('')
    } else {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Asunto del email
        </label>
        <input
          type="text"
          required
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Ej: Nuevo libro disponible — El nombre del viento"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Libro a destacar <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <select
          value={bookId}
          onChange={e => setBookId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        >
          <option value="">— Sin libro destacado —</option>
          {books.map(b => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
      </div>

      {status === 'ok' && result && (
        <p className="text-sm text-green-700 font-medium">
          ✓ Enviado a {result.sent} suscriptores{result.failed > 0 ? ` (${result.failed} fallaron)` : ''}.
        </p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-600">Algo salió mal. Intentá de nuevo.</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || totalSubscribers === 0}
        className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {status === 'loading'
          ? 'Enviando…'
          : totalSubscribers === 0
          ? 'Sin suscriptores'
          : `Enviar a ${totalSubscribers} suscriptores`}
      </button>
    </form>
  )
}
