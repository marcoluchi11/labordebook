'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  bookId: string
  bookTitle: string
}

export function DeleteBookButton({ bookId, bookTitle }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'warn' | 'confirm'>('idle')
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmed = typed.trim() === bookTitle.trim()

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/books/${bookId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Error al eliminar')
      }
      router.push('/admin/books')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoading(false)
    }
  }

  function reset() {
    setStep('idle')
    setTyped('')
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => setStep('warn')}
        className="text-red-500 hover:text-red-700 text-xs transition-colors"
      >
        Eliminar
      </button>

      {step !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={reset} />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {step === 'warn' && (
              <>
                <div className="bg-red-600 px-6 py-5">
                  <p className="text-2xl mb-1">⚠️</p>
                  <h2 className="text-white text-lg font-bold leading-tight">
                    Acción irreversible
                  </h2>
                  <p className="text-red-200 text-sm mt-1">
                    Esta operación no se puede deshacer.
                  </p>
                </div>

                <div className="px-6 py-5">
                  <p className="text-gray-800 font-medium mb-3">
                    Estás por eliminar permanentemente:
                  </p>
                  <p className="text-gray-900 font-bold mb-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                    "{bookTitle}"
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1.5 mb-6">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">✕</span>
                      El archivo PDF y/o EPUB del storage
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">✕</span>
                      La portada del libro
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">✕</span>
                      Todos los tokens de descarga emitidos
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">✕</span>
                      El registro del libro en la base de datos
                    </li>
                  </ul>

                  <div className="flex gap-3">
                    <button
                      onClick={reset}
                      className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => setStep('confirm')}
                      className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Sí, quiero eliminarlo →
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 'confirm' && (
              <>
                <div className="bg-red-600 px-6 py-5">
                  <p className="text-2xl mb-1">🔴</p>
                  <h2 className="text-white text-lg font-bold leading-tight">
                    Confirmación final
                  </h2>
                  <p className="text-red-200 text-sm mt-1">
                    Último paso antes de eliminar.
                  </p>
                </div>

                <div className="px-6 py-5">
                  <p className="text-sm text-gray-600 mb-2">
                    Para confirmar, escribí el título exacto del libro:
                  </p>
                  <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-3 font-mono select-all">
                    {bookTitle}
                  </p>
                  <input
                    type="text"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder="Escribí el título acá..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                    autoFocus
                  />

                  {error && (
                    <p className="text-red-600 text-sm mb-3">{error}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={reset}
                      className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={!confirmed || loading}
                      className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Eliminando...' : 'Eliminar definitivamente'}
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}
