import { createServiceRoleClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const supabase = createServiceRoleClient()

  const [
    { count: totalPurchases },
    { data: monthlyRevenue },
    { data: purchasesPerBook },
    { data: dailySales },
  ] = await Promise.all([
    supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('payment_status', 'approved'),
    supabase.rpc('get_monthly_revenue'),
    supabase.rpc('get_purchases_per_book'),
    supabase.rpc('get_daily_purchases', { days_back: 30 }),
  ])

  const currentMonthRevenue = (monthlyRevenue as { month: string; revenue: number }[] | null)?.[0]?.revenue ?? 0

  return (
    <AdminDashboard
      totalPurchases={totalPurchases ?? 0}
      currentMonthRevenue={Number(currentMonthRevenue)}
      purchasesPerBook={(purchasesPerBook as { book_title: string; purchase_count: number; total_revenue: number }[] | null) ?? []}
      dailySales={(dailySales as { day: string; count: number }[] | null) ?? []}
    />
  )
}
