import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService } from '../../services/products.service'
import { ordersService, type SaleOrderDto } from '../../services/orders.service'
import { usersService } from '../../services/users.service'
import { useForm } from 'react-hook-form'

interface Props { currency: 'KES' | 'ETB' }
interface CartItem { productId: string; productName: string; quantity: number; priceKes: number; priceEtb: number }

export default function SellerDashboard({ currency }: Props) {
  const qc = useQueryClient()
  const [cart, setCart] = useState<CartItem[]>([])
  const [tab, setTab] = useState<'order' | 'myorders' | 'customer'>('order')
  const [reserveModal, setReserveModal] = useState(false)
  const [customerModal, setCustomerModal] = useState(false)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const { data: products } = useQuery({
    queryKey: ['products-public'],
    queryFn: productsService.listOwner,
  })

  // Extract unique categories
  const categories = ['all', ...(products ? Array.from(new Set(products.map(p => p.category))) : [])]

  // Filter products based on search and category
  const filteredProducts = (products || []).filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const { data: myOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: ordersService.myOrders,
  })

  const { mutate: cancelOrder } = useMutation({
    mutationFn: ordersService.cancel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-orders'] }),
  })

  const { mutate: convertToPending } = useMutation({
    mutationFn: ordersService.convertToPending,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-orders'] }),
  })

  const price = (item: CartItem) =>
    currency === 'KES' ? item.priceKes : item.priceEtb

  const totalAmount = cart.reduce((sum, i) => sum + price(i) * i.quantity, 0)

  function addToCart(p: { id: string; name: string; priceKes: number; priceEtb: number }) {
    const q = qty[p.id] || 1
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id)
      if (existing) return prev.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + q } : i)
      return [...prev, { productId: p.id, productName: p.name, quantity: q, priceKes: p.priceKes, priceEtb: p.priceEtb }]
    })
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.productId !== id))
  }

  const statusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    RESERVED: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Seller Dashboard</h1>
        <button onClick={() => setCustomerModal(true)}
          className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700">
          + Add Customer
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['order', 'myorders'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t === 'order' ? 'Create Order' : 'My Orders'}
          </button>
        ))}
      </div>

      {/* Create Order tab */}
      {tab === 'order' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product list */}
          <div>
            <div className="mb-4 space-y-3">
              <h2 className="text-sm font-semibold text-gray-600">Products</h2>
              
              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Category filter */}
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      categoryFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product list */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No products found</p>
              ) : (
                filteredProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {currency === 'KES' ? `KES ${p.priceKes.toFixed(2)}` : `ETB ${p.priceEtb.toFixed(2)}`}
                        {' · '}Stock: {p.stockQuantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={1} max={p.stockQuantity}
                        value={qty[p.id] ?? 1}
                        onChange={(e) => setQty((q) => ({ ...q, [p.id]: parseInt(e.target.value) || 1 }))}
                        className="w-14 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center"
                      />
                      <button onClick={() => addToCart(p)}
                        className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-lg hover:bg-indigo-700">
                        Add
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-3">Cart</h2>
            {cart.length === 0
              ? <p className="text-sm text-gray-400">No items added yet.</p>
              : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity} · {currency === 'KES' ? `KES ${(item.priceKes * item.quantity).toFixed(2)}` : `ETB ${(item.priceEtb * item.quantity).toFixed(2)}`}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-400 text-xs hover:text-red-600">Remove</button>
                    </div>
                  ))}
                  <div className="bg-gray-50 rounded-xl px-4 py-3 font-semibold text-sm">
                    Total: {currency === 'KES' ? 'KES' : 'ETB'} {totalAmount.toFixed(2)}
                  </div>
                  <div className="pt-2">
                    <button onClick={() => setReserveModal(true)}
                      className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700">
                      Reserve for Customer
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* My Orders tab */}
      {tab === 'myorders' && (
        <div>
          {ordersLoading
            ? <p className="text-sm text-gray-400">Loading...</p>
            : (
              <div className="space-y-3">
                {myOrders?.map((order: SaleOrderDto) => (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[order.status]}`}>{order.status}</span>
                      <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Total: KES {order.totalAmount.toFixed(2)}</p>
                    {order.reservedForName && (
                      <p className="text-xs text-blue-600 mt-1">Reserved for: {order.reservedForName} ({order.reservedForPhone})</p>
                    )}
                    {order.cancellationReason && (
                      <p className="text-xs text-gray-400 mt-1">Reason: {order.cancellationReason}</p>
                    )}
                    <div className="flex gap-3 mt-3">
                      {(order.status === 'PENDING' || order.status === 'RESERVED') && (
                        <button onClick={() => { if (confirm('Cancel order?')) cancelOrder(order.id) }}
                          className="text-red-500 text-xs hover:underline">Cancel</button>
                      )}
                      {order.status === 'RESERVED' && (
                        <button onClick={() => convertToPending(order.id)}
                          className="text-indigo-600 text-xs hover:underline">Convert to Sale</button>
                      )}
                    </div>
                  </div>
                ))}
                {myOrders?.length === 0 && <p className="text-sm text-gray-400">No orders yet.</p>}
              </div>
            )}
        </div>
      )}

      {/* Reserve modal */}
      {reserveModal && (
        <ReserveModal
          cart={cart}
          onClose={() => setReserveModal(false)}
          onSaved={() => { 
            setReserveModal(false); 
            setCart([]); 
            setTab('myorders'); // Switch to My Orders tab to see the new order
            qc.invalidateQueries({ queryKey: ['my-orders'] }) 
          }}
        />
      )}

      {/* Add customer modal */}
      {customerModal && (
        <AddCustomerModal onClose={() => setCustomerModal(false)} />
      )}
    </div>
  )
}

function ReserveModal({ cart, onClose, onSaved }: {
  cart: CartItem[]
  onClose: () => void
  onSaved: () => void
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
      setTimeout(() => {
        onSaved()
      }, 800) // Brief delay to show success message
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
