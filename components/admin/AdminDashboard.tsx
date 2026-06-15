'use client'

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from 'recharts'

interface Props {
  totalPurchases: number
  currentMonthRevenue: number
  purchasesPerBook: { book_title: string; purchase_count: number; total_revenue: number }[]
  dailySales: { day: string; count: number }[]
}

export function AdminDashboard({ totalPurchases, currentMonthRevenue, purchasesPerBook, dailySales }: Props) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Ventas este mes</p>
          <p className="text-3xl font-bold text-gray-900">
            ${currentMonthRevenue.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total de ventas</p>
          <p className="text-3xl font-bold text-gray-900">{totalPurchases}</p>
        </div>
      </div>

      {/* Daily sales chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Ventas diarias (últimos 30 días)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailySales}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#111" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Purchases per book */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Ventas por libro</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={purchasesPerBook} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="book_title" tick={{ fontSize: 11 }} width={140} />
            <Tooltip />
            <Bar dataKey="purchase_count" fill="#111" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
