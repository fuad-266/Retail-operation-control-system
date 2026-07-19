import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersService, type SaleOrderDto } from '../../services/orders.service'
import { paymentsService, type PaymentMethod } from '../../services/payments.service'

interface Props { currency: 'KES' | 'ETB' }

export default function CashierDashboard({ currency }: Props) {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'pending' | 'reserved' | 'online'>('pending')

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-orders'],
    queryFn: ordersService.pending,
  })

  const { data: reserved, isLoading: reservedLoading } = useQuery({
    queryKey: ['reserved-orders'],
    queryFn: ordersService.reserved,
  })

  const { data: onlineQueue, isLoading: onlineLoading } = useQuery({
    queryKey: ['online-pending-verification'],
    queryFn: ordersService.pendingOnlineVerification,
  })

  const { mutate: convertToPending } = useMutation({
    mutationFn: ordersService.convertToPending,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-orders'] })
      qc.invalidateQueries({ queryKey: ['reserved-orders'] })
    },
  })

  const [confirmModal, setConfirmModal] = useState<{ orderId: string; online: boolean } | null>(null)
  const [rejectModal, setRejectModal] = useState<string | null>(null)

  const fmt = (amount: number) => currency === 'KES' ? `KES ${amount.toFixed(2)}` : `ETB ${amount.toFixed(2)}`
  const isExpired = (order: SaleOrderDto) =>
    order.reservationExpiresAt ? new Date(order.reservationExpiresAt) < new Date() : false

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Cashier Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'reserved', 'online'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t === 'pending' ? 'Pending Orders' : t === 'reserved' ? 'Reserved Orders' : 'Online Payments'}
          </button>
        ))}
      </div>

      {/* Pending Orders */}
      {tab === 'pending' && (
        <OrderList
          orders={pending ?? []}
          loading={pendingLoading}
          currency={currency}
          renderActions={(order) => (
            <button
              onClick={() => setConfirmModal({ orderId: order.id, online: false })}
              className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-700">
              Confirm Payment
            </button>
          )}
        />
      )}

      {/* Reserved Orders */}
      {tab === 'reserved' && (
        <OrderList
          orders={reserved ?? []}
          loading={reservedLoading}
          currency={currency}
          renderActions={(order) => (
            <div className="flex gap-2 items-center">
              {isExpired(order) && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Expired</span>
              )}
              {!isExpired(order) && order.reservationExpiresAt && (
                <span className="text-xs text-gray-400">
                  Expires {new Date(order.reservationExpiresAt).toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => convertToPending(order.id)}
                className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-indigo-700">
                Convert to Sale
              </button>
            </div>
          )}
        />
      )}

      {/* Online Payment Queue */}
      {tab === 'online' && (
        <div>
          {onlineLoading && <p className="text-sm text-gray-400">Loading...</p>}
          <div className="space-y-3">
            {(onlineQueue as OnlineOrderRow[] ?? []).map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">{order.customerName}</span>
                  <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {order.items?.map((i: { productName: string; quantity: number }) => `${i.productName} ×${i.quantity}`).join(', ')}
                </p>
                <p className="text-sm font-semibold mt-1">{fmt(order.totalAmount)}</p>
                <div className="flex gap-2 mt-3">
                  <a
                    href={`/api/mobile/orders/${order.id}/screenshot`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-lg hover:bg-gray-200">
                    View Screenshot
                  </a>
                  <button
                    onClick={() => setConfirmModal({ orderId: order.id, online: true })}
                    className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-700">
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectModal(order.id)}
                    className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-600">
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {!onlineLoading && (onlineQueue as unknown[])?.length === 0 && (
              <p className="text-sm text-gray-400">No online payments awaiting verification.</p>
            )}
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {confirmModal && (
        <ConfirmPaymentModal
          orderId={confirmModal.orderId}
          isOnline={confirmModal.online}
          onClose={() => setConfirmModal(null)}
          onSaved={() => {
            setConfirmModal(null)
            qc.invalidateQueries({ queryKey: ['pending-orders'] })
            qc.invalidateQueries({ queryKey: ['online-pending-verification'] })
          }}
        />
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <RejectModal
          orderId={rejectModal}
          onClose={() => setRejectModal(null)}
          onSaved={() => {
            setRejectModal(null)
            qc.invalidateQueries({ queryKey: ['online-pending-verification'] })
          }}
        />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface OnlineOrderRow {
  id: string
  customerName: string
  totalAmount: number
  createdAt: string
  items: { productName: string; quantity: number }[]
}

function OrderList({ orders, loading, currency, renderActions }: {
  orders: SaleOrderDto[]
  loading: boolean
  currency: 'KES' | 'ETB'
  renderActions: (order: SaleOrderDto) => React.ReactNode
}) {
  const fmt = (amount: number) => currency === 'KES' ? `KES ${amount.toFixed(2)}` : `ETB ${amount.toFixed(2)}`
  if (loading) return <p className="text-sm text-gray-400">Loading...</p>
  if (orders.length === 0) return <p className="text-sm text-gray-400">Nothing here.</p>

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{order.sellerName}</span>
            <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-500">
            {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
          </p>
          <p className="text-sm font-semibold mt-1">{fmt(order.totalAmount)}</p>
          {order.reservedForName && (
            <p className="text-xs text-blue-600 mt-0.5">For: {order.reservedForName} ({order.reservedForPhone})</p>
          )}
          <div className="mt-3">{renderActions(order)}</div>
        </div>
      ))}
    </div>
  )
}

function ConfirmPaymentModal({ orderId, isOnline, onClose, onSaved }: {
  orderId: string
  isOnline: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [curr, setCurr] = useState<'KES' | 'ETB'>('KES')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [receipt, setReceipt] = useState<{ receiptNumber: string } | null>(null)

  async function confirm() {
    setError(''); setPending(true)
    try {
      const r = isOnline
        ? await paymentsService.confirmOnline(orderId, { paymentMethod: method, paymentCurrency: curr })
        : await paymentsService.confirmPayment(orderId, { paymentMethod: method, paymentCurrency: curr })
      setReceipt(r)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'
      setError(msg)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">Confirm Payment</h2>
        {receipt ? (
          <div className="text-center space-y-3">
            <p className="text-green-600 font-semibold">Payment confirmed!</p>
            <p className="text-sm text-gray-700">Receipt: <strong>{receipt.receiptNumber}</strong></p>
            <button onClick={onSaved} className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700">Done</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Payment Method</label>
              <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className={inp}>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Currency</label>
              <select value={curr} onChange={e => setCurr(e.target.value as 'KES' | 'ETB')} className={inp}>
                <option value="KES">KES</option>
                <option value="ETB">ETB</option>
              </select>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={confirm} disabled={pending} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm disabled:opacity-50">
                {pending ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RejectModal({ orderId, onClose, onSaved }: {
  orderId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function reject() {
    if (!reason.trim()) { setError('Reason is required'); return }
    setError(''); setPending(true)
    try {
      await paymentsService.rejectOnline(orderId, reason)
      onSaved()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'
      setError(msg)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">Reject Payment</h2>
        <label className="block text-xs text-gray-500 mb-1">Reason *</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          placeholder="e.g. Screenshot unclear / amount incorrect" />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        <div className="flex gap-3 mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Cancel</button>
          <button onClick={reject} disabled={pending} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm disabled:opacity-50">
            {pending ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
