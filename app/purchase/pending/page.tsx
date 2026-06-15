export default function PurchasePendingPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-6">⏳</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Pago pendiente</h1>
      <p className="text-gray-600 leading-relaxed">
        Tu pago está siendo procesado. Una vez confirmado, te enviaremos el email
        con acceso a tu libro.
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Esto puede ocurrir con transferencias bancarias u otros métodos que requieren validación manual.
      </p>
    </main>
  )
}
