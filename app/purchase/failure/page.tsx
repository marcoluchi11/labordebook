import Link from 'next/link'

export default function PurchaseFailurePage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-6">❌</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">El pago no se completó</h1>
      <p className="text-gray-600 leading-relaxed mb-8">
        Hubo un problema con tu pago. No se realizó ningún cobro.
      </p>
      <Link href="/" className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
        Volver al catálogo
      </Link>
    </main>
  )
}
