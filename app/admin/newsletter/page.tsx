import { createServiceRoleClient } from '@/lib/supabase/server'
import { NewsletterSendForm } from '@/components/admin/NewsletterSendForm'

export const dynamic = 'force-dynamic'

export default async function NewsletterAdminPage() {
  const supabase = createServiceRoleClient()

  const [{ data: subscribers }, { data: books }] = await Promise.all([
    supabase
      .from('newsletter_subscribers')
      .select('id, email, name, subscribed_at, is_active')
      .order('subscribed_at', { ascending: false }),
    supabase
      .from('books')
      .select('id, title')
      .eq('is_published', true)
      .order('title'),
  ])

  const active = (subscribers ?? []).filter(s => s.is_active)
  const inactive = (subscribers ?? []).filter(s => !s.is_active)

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Newsletter</h1>
      <p className="text-gray-500 text-sm mb-8">
        {active.length} suscriptores activos · {inactive.length} dados de baja
      </p>

      {/* Send campaign */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Enviar campaña</h2>
        <NewsletterSendForm books={books ?? []} totalSubscribers={active.length} />
      </div>

      {/* Subscribers table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Suscriptores activos</h2>
        </div>
        {active.length === 0 ? (
          <p className="px-6 py-8 text-gray-400 text-sm text-center">Todavía no hay suscriptores.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Email</th>
                <th className="px-6 py-3 text-left font-medium">Nombre</th>
                <th className="px-6 py-3 text-left font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {active.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">{sub.email}</td>
                  <td className="px-6 py-3 text-gray-500">{sub.name ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-400">
                    {new Date(sub.subscribed_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
