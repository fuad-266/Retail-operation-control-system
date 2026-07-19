import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ordersService } from '../../services/orders.service'
import { productsService } from '../../services/products.service'
import { settingsService } from '../../services/settings.service'

interface Props { currency: 'KES' | 'ETB' }

export default function OwnerDashboard({ currency }: Props) {
  const { data: pending } = useQuery({ queryKey: ['pending-orders'], queryFn: ordersService.pending })
  const { data: lowStock } = useQuery({ queryKey: ['low-stock'], queryFn: productsService.lowStock })
  const { data: rate } = useQuery({ queryKey: ['exchange-rate'], queryFn: settingsService.getRate })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Owner Dashboard</h1>

      {rate?.staleRateWarning && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg px-4 py-3 text-sm">
          ⚠️ Exchange rate is more than 24 hours old. Consider updating it in Settings.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          label="Pending Orders"
          value={pending?.length ?? '—'}
          color="bg-indigo-50 text-indigo-700"
        />
        <Card
          label="Low Stock Items"
          value={lowStock?.length ?? '—'}
          color="bg-red-50 text-red-700"
        />
        <Card
          label="Active Currency"
          value={currency}
          color="bg-green-50 text-green-700"
        />
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Products', to: '/owner/products' },
          { label: 'Reports', to: '/owner/reports' },
          { label: 'Settings', to: '/owner/settings' },
          { label: 'Users', to: '/owner/users' },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-white border border-gray-200 rounded-xl p-4 text-center text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function Card({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-xl p-5 ${color}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}
