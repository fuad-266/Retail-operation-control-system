import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../../services/reports.service'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

interface Props { currency: 'KES' | 'ETB' }

export default function ReportsPage({ currency }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = today.slice(0, 7) + '-01'

  const [from, setFrom] = useState(firstOfMonth)
  const [to, setTo] = useState(today)

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-report', from, to],
    queryFn: () => reportsService.sales(from, to),
  })

  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ['revenue-report', from, to],
    queryFn: () => reportsService.revenue(from, to),
  })

  const { data: sellers } = useQuery({
    queryKey: ['sellers-report'],
    queryFn: reportsService.sellers,
  })

  const { data: inventory } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: reportsService.inventory,
  })

  const fmt = (n: number) =>
    currency === 'KES' ? `KES ${n?.toFixed(2)}` : `ETB ${n?.toFixed(2)}`

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-bold text-gray-800">Reports</h1>

      {/* Date range picker */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {/* Sales summary */}
      <Section title="Sales Summary">
        {salesLoading ? <p className="text-sm text-gray-400">Loading...</p> : (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Stat label="Total Orders" value={sales?.totalOrders ?? 0} />
            <Stat label={`Revenue (${currency})`} value={fmt(currency === 'KES' ? sales?.totalRevenueKes : sales?.totalRevenueEtb)} />
          </div>
        )}
        {sales?.breakdown?.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sales.breakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="revenueKes" fill="#6366f1" name="Revenue (KES)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* Revenue */}
      <Section title="Revenue & Profitability">
        {revLoading ? <p className="text-sm text-gray-400">Loading...</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Revenue KES" value={`KES ${revenue?.totalRevenueKes?.toFixed(2)}`} />
            <Stat label="Revenue ETB" value={`ETB ${revenue?.totalRevenueEtb?.toFixed(2)}`} />
            <Stat label="COGS" value={`KES ${revenue?.cogs?.toFixed(2)}`} />
            <Stat label="Profit" value={`KES ${revenue?.profit?.toFixed(2)}`} />
            <Stat label="Margin" value={`${revenue?.profitMarginPercent?.toFixed(1)}%`} />
          </div>
        )}
      </Section>

      {/* Seller leaderboard */}
      <Section title="Seller Performance">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 pr-4">Seller</th>
              <th className="pb-2 pr-4">Orders</th>
              <th className="pb-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {sellers?.map((s: { sellerId: string; sellerName: string; orderCount: number; totalRevenueKes: number; totalRevenueEtb: number }) => (
              <tr key={s.sellerId} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">{s.sellerName}</td>
                <td className="py-2 pr-4">{s.orderCount}</td>
                <td className="py-2">{fmt(currency === 'KES' ? s.totalRevenueKes : s.totalRevenueEtb)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Inventory */}
      <Section title="Inventory">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 pr-4">Product</th>
              <th className="pb-2 pr-4">Stock</th>
              <th className="pb-2 pr-4">Min Alert</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory?.products?.map((p: { id: string; name: string; stockQuantity: number; minStockAlert: number; isLowStock: boolean }) => (
              <tr key={p.id} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">{p.name}</td>
                <td className="py-2 pr-4">{p.stockQuantity}</td>
                <td className="py-2 pr-4">{p.minStockAlert}</td>
                <td className="py-2">
                  {p.isLowStock
                    ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Low Stock</span>
                    : <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">OK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-700 mb-3">{title}</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-4">{children}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}
