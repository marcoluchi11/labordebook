export default function PurchaseSuccessPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-6">✉️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Compra exitosa!</h1>
      <p className="text-gray-600 leading-relaxed">
        Te enviamos un email con el acceso a tu libro.
        Revisá tu bandeja de entrada (y spam, por las dudas).
      </p>
      <p className="text-sm text-gray-400 mt-4">
        El email puede tardar hasta 2 minutos en llegar.
      </p>
    </main>
  )
}
