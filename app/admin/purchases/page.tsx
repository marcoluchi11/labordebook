import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminPurchasesPage() {
  const supabase = createServiceRoleClient()

  const { data: purchases } = await supabase
    .from('purchases')
    .select('*, books(title)')
    .order('created_at', { ascending: false })
    .limit(200)

  const statusLabel: Record<string, string> = {
    approved: 'Aprobada',
    pending: 'Pendiente',
    rejected: 'Rechazada',
    refunded: 'Reembolsada',
  }

  const statusColor: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ventas</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Fecha</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Comprador</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Libro</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Monto</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {(purchases ?? []).map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">
                  {new Date(p.created_at).toLocaleDateString('es-AR')}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{p.buyer_name}</p>
                  <p className="text-gray-400 text-xs">{p.buyer_email}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {(p.books as { title: string } | null)?.title ?? '—'}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {p.amount_paid ? `$${Number(p.amount_paid).toLocaleString('es-AR')}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[p.payment_status] ?? ''}`}>
                    {statusLabel[p.payment_status] ?? p.payment_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(purchases ?? []).length === 0 && (
          <p className="text-center text-gray-400 py-12">No hay ventas aún.</p>
        )}
      </div>
    </div>
  )
}
