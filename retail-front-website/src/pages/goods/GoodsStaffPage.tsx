import { useState } from 'react'
import { paymentsService, type ReceiptDto } from '../../services/payments.service'

export default function GoodsStaffPage() {
  const [search, setSearch] = useState('')
  const [receipt, setReceipt] = useState<ReceiptDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fulfilling, setFulfilling] = useState(false)
  const [fulfillError, setFulfillError] = useState('')

  async function lookupReceipt() {
    if (!search.trim()) return
    setError(''); setReceipt(null); setLoading(true); setFulfillError('')
    try {
      const r = await paymentsService.getReceipt(search.trim())
      setReceipt(r)
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      setError(status === 404 ? 'Receipt not found.' : 'Failed to fetch receipt.')
    } finally {
      setLoading(false)
    }
  }

  async function fulfill() {
    if (!receipt) return
    setFulfillError(''); setFulfilling(true)
    try {
      const updated = await paymentsService.fulfillReceipt(receipt.receiptNumber)
      setReceipt(updated)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'
      setFulfillError(msg)
    } finally {
      setFulfilling(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Goods Release</h1>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') lookupReceipt() }}
          placeholder="Enter receipt number e.g. RCP-20260719-0001"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={lookupReceipt}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Receipt card */}
      {receipt && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">{receipt.receiptNumber}</h2>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              receipt.status === 'FULFILLED'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {receipt.status}
            </span>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>Confirmed by: <strong>{receipt.confirmedByName}</strong></p>
            <p>Payment: <strong>{receipt.paymentMethod}</strong> in <strong>{receipt.paymentCurrency}</strong></p>
            <p>Total: <strong>{receipt.paymentCurrency} {receipt.amount.toFixed(2)}</strong></p>
            <p className="text-xs text-gray-400">{new Date(receipt.createdAt).toLocaleString()}</p>
          </div>

          {/* Items */}
          {receipt.items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Items</p>
              <div className="space-y-1">
                {receipt.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                    {item.unitPrice != null && (
                      <span className="text-gray-500">KES {(item.unitPrice * item.quantity).toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {fulfillError && (
            <p className="text-red-500 text-xs">{fulfillError}</p>
          )}

          <button
            onClick={fulfill}
            disabled={receipt.status === 'FULFILLED' || fulfilling}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
              receipt.status === 'FULFILLED'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
            }`}
          >
            {fulfilling ? 'Releasing...' : receipt.status === 'FULFILLED' ? 'Already Released' : 'Release Goods'}
          </button>
        </div>
      )}
    </div>
  )
}
