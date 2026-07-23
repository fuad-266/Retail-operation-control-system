import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService } from '../../services/products.service'
import { ordersService, type SaleOrderDto } from '../../services/orders.service'
import { usersService } from '../../services/users.service'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'

interface Props { currency: 'KES' | 'ETB' }
interface CartItem { productId: string; productName: string; quantity: number; priceKes: number; priceEtb: number }

type OrderFilter = 'all' | 'PENDING' | 'RESERVED' | 'PAID' | 'CANCELLED'

export default function SellerDashboard({ currency }: Props) {
  const { user } = useAuth()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [cart, setCart] = useState<CartItem[]>([])
  const [createOrderModal, setCreateOrderModal] = useState(false)
  const [customerModal, setCustomerModal] = useState(false)
  const [reserveMode, setReserveMode] = useState(false)
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [qty, setQty] = useState<Record<string, number>>({})

  const { data: products } = useQuery({
    queryKey: ['products-public'],
    queryFn: productsService.listOwner,
  })

  const { data: myOrders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      try {
        const result = await ordersService.myOrders()
        console.log('Orders fetched successfully:', result)
        return result
      } catch (err) {
        console.error('Failed to fetch orders:', err)
        throw err
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  const { mutate: cancelOrder } = useMutation({
    mutationFn: ordersService.cancel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-orders'] }),
  })

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!myOrders) return []
    if (orderFilter === 'all') return myOrders
    return myOrders.filter((o) => o.status === orderFilter)
  }, [myOrders, orderFilter])

  // Stats
  const todayOrders = myOrders || []
  const paidOrders = todayOrders.filter((o) => o.status === 'PAID')
  const reservedOrders = todayOrders.filter((o) => o.status === 'RESERVED')
  const todaySales = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const price = (item: CartItem) => currency === 'KES' ? item.priceKes : item.priceEtb
  const totalAmount = cart.reduce((sum, i) => sum + price(i) * i.quantity, 0)

  function addToCart(p: { id: string; name: string; priceKes: number; priceEtb: number }) {
    const q = qty[p.id] || 1
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id)
      if (existing) return prev.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + q } : i)
      return [...prev, { productId: p.id, productName: p.name, quantity: q, priceKes: p.priceKes, priceEtb: p.priceEtb }]
    })
    setSearchTerm('') // Clear search after adding
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.productId !== id))
  }

  function updateQuantity(id: string, delta: number) {
    setCart((prev) =>
      prev.map((i) =>
        i.productId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      )
    )
  }

  const getTimeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
    if (mins < 60) return `${mins} min ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const getExpiryCountdown = (expiryDate: string | null) => {
    if (!expiryDate) return ''
    const ms = new Date(expiryDate).getTime() - Date.now()
    if (ms < 0) return 'Expired'
    const hours = Math.floor(ms / 3600000)
    const mins = Math.floor((ms % 3600000) / 60000)
    return `Expires in ${hours}h ${mins}m`
  }

  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    RESERVED: 'bg-purple-100 text-purple-700',
    PAID: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-500',
  }

  const filterPills: { key: OrderFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'RESERVED', label: 'Reserved' },
    { key: 'PAID', label: 'Paid' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting()}, {user?.fullName || 'Seller'}
            </h1>
            <p className="text-sm text-gray-500">Seller · Main Floor</p>
          </div>
          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.fullName?.charAt(0) || 'S'}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">My sales today</p>
            <p className="text-3xl font-bold text-gray-900">
              {currency} {currency === 'KES' ? todaySales.toFixed(2) : (todaySales / 1).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Orders created</p>
            <p className="text-3xl font-bold text-gray-900">{todayOrders.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Awaiting payment</p>
            <p className="text-3xl font-bold text-gray-900">{reservedOrders.length}</p>
          </div>
        </div>

        {/* Primary Action */}
        <button
          onClick={() => setCreateOrderModal(true)}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create order
        </button>

        {/* Orders List Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">My orders</h2>

          {/* Filter Pills */}
          <div className="flex gap-2 mb-4">
            {filterPills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => setOrderFilter(pill.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  orderFilter === pill.key
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="space-y-3">
            {ordersLoading && <p className="text-sm text-gray-400">Loading orders...</p>}
            {ordersError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-600 font-medium">Error loading orders</p>
                <p className="text-xs text-red-500 mt-1">
                  {(ordersError as any)?.response?.data?.message || (ordersError as Error).message}
                </p>
              </div>
            )}
            {!ordersLoading && !ordersError && filteredOrders.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <p className="text-gray-500">No orders yet today</p>
                <p className="text-sm text-gray-400 mt-1">Orders you create will appear here</p>
              </div>
            )}
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {order.status === 'RESERVED' && order.reservationExpiresAt
                      ? getExpiryCountdown(order.reservationExpiresAt)
                      : order.status === 'PAID'
                      ? `Paid · Receipt #${order.id.slice(0, 4)}`
                      : order.status === 'CANCELLED' && order.cancellationReason
                      ? order.cancellationReason
                      : getTimeAgo(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {currency} {order.totalAmount.toFixed(2)}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${statusColor[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  {order.status === 'RESERVED' && (
                    <button
                      onClick={() => {
                        if (confirm('Cancel this order?')) cancelOrder(order.id)
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customers Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Customers</h2>
          <button
            onClick={() => setCustomerModal(true)}
            className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Add customer account for mobile app
          </button>
        </div>
      </div>

      {/* Create Order Modal */}
      {createOrderModal && (
        <CreateOrderModal
          cart={cart}
          currency={currency}
          products={products || []}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          updateQuantity={updateQuantity}
          totalAmount={totalAmount}
          reserveMode={reserveMode}
          setReserveMode={setReserveMode}
          onClose={() => {
            setCreateOrderModal(false)
            setCart([])
            setReserveMode(false)
            setSearchTerm('')
          }}
          onSuccess={() => {
            setCreateOrderModal(false)
            setCart([])
            setReserveMode(false)
            setSearchTerm('')
            qc.invalidateQueries({ queryKey: ['my-orders'] })
          }}
          qc={qc}
        />
      )}

      {/* Add Customer Modal */}
      {customerModal && <AddCustomerModal onClose={() => setCustomerModal(false)} />}
    </div>
  )
}

function ReserveModal({ cart, onClose, onSaved, qc }: {
  cart: CartItem[]
  onClose: () => void
  onSaved: () => void
  qc: any
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ name: string; phone: string }>()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function onSubmit(data: { name: string; phone: string }) {
    setError('')
    setSuccess('')
    try {
      await ordersService.createReservedOrder({
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        reservedForName: data.name,
        reservedForPhone: data.phone,
      })
      setSuccess('Order reserved successfully!')
      // Wait a bit then close and refresh
      setTimeout(async () => {
        await qc.invalidateQueries({ queryKey: ['my-orders'] })
        onSaved()
      }, 500)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'
      setError(msg)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">Reserve for Customer</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Customer Name *</label>
            <input {...register('name', { required: 'Required' })} className={inp} disabled={!!success} />
            {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Customer Phone *</label>
            <input {...register('phone', { required: 'Required' })} className={inp} disabled={!!success} />
            {errors.phone && <p className="text-red-500 text-xs mt-0.5">{errors.phone.message}</p>}
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-600 text-xs font-medium">{success}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={!!success} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSubmitting || !!success} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm disabled:opacity-50">
              {isSubmitting ? 'Reserving...' : 'Reserve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddCustomerModal({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{
    fullName: string; phoneNumber: string; email: string; password: string
  }>()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function onSubmit(data: { fullName: string; phoneNumber: string; email: string; password: string }) {
    setError(''); setSuccess('')
    try {
      const user = await usersService.createCustomer(data)
      setSuccess(`Created: ${user.fullName} — Phone: ${user.phoneNumber}`)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'
      setError(msg)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">Add Customer</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Full Name *</label>
            <input {...register('fullName', { required: 'Required' })} className={inp} />
            {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Phone Number *</label>
            <input {...register('phoneNumber', { required: 'Required' })} className={inp} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email (optional)</label>
            <input {...register('email')} className={inp} type="email" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Password *</label>
            <input type="password" {...register('password', { required: 'Required' })} className={inp} />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-600 text-xs">{success}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Close</button>
            {!success && (
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm disabled:opacity-50">
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
