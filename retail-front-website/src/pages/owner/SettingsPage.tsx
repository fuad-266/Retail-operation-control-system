import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService } from '../../services/settings.service'
import { useForm } from 'react-hook-form'

export default function SettingsPage() {
  const qc = useQueryClient()

  const { data: rate } = useQuery({ queryKey: ['exchange-rate'], queryFn: settingsService.getRate })
  const { data: history } = useQuery({ queryKey: ['rate-history'], queryFn: settingsService.getRateHistory })
  const { data: shopSettings } = useQuery({ queryKey: ['shop-settings'], queryFn: settingsService.getAll })

  const { register: regRate, handleSubmit: submitRate, watch: watchRate } = useForm<{ rate: number }>()
  const { register: regShop, handleSubmit: submitShop } = useForm<{
    receipt_show_item_prices: string
    payment_bank_account: string
    payment_mobile_money: string
  }>({
    values: shopSettings
      ? {
          receipt_show_item_prices: shopSettings['receipt_show_item_prices'] ?? 'true',
          payment_bank_account: shopSettings['payment_bank_account'] ?? '',
          payment_mobile_money: shopSettings['payment_mobile_money'] ?? '',
        }
      : undefined,
  })

  const newRate = watchRate('rate')
  const previewEtb = newRate > 0 ? (1 / newRate).toFixed(6) : '—'

  const { mutate: setRate, isPending: settingRate } = useMutation({
    mutationFn: (r: number) => settingsService.setRate(r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exchange-rate'] })
      qc.invalidateQueries({ queryKey: ['rate-history'] })
    },
  })

  const { mutate: saveShop, isPending: savingShop } = useMutation({
    mutationFn: (d: Record<string, string>) => settingsService.update(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shop-settings'] }),
  })

  const [rateError, setRateError] = useState('')
  const [shopError, setShopError] = useState('')

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-bold text-gray-800">Settings</h1>

      {/* Exchange rate */}
      <Section title="Exchange Rate">
        <div className="mb-3 text-sm text-gray-600">
          Current rate: <strong>{rate?.rate}</strong> — {rate?.label}
          {rate?.staleRateWarning && (
            <span className="ml-2 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded">
              Stale — older than 24h
            </span>
          )}
        </div>

        <form onSubmit={submitRate((d) => { setRateError(''); setRate(d.rate) })}
          className="flex gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              New Rate (ETB = KES ÷ rate)
            </label>
            <input type="number" step="0.000001"
              {...regRate('rate', { required: true, min: 0.000001 })}
              className={input}
              placeholder="e.g. 0.55"
            />
            {newRate > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">Preview: 1 KES = {previewEtb} ETB</p>
            )}
          </div>
          <button type="submit" disabled={settingRate}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            Update Rate
          </button>
        </form>
        {rateError && <p className="text-red-500 text-xs mt-1">{rateError}</p>}

        {/* History table */}
        {history && history.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400 border-b">
                  <th className="pb-1 pr-4">Rate</th>
                  <th className="pb-1 pr-4">Label</th>
                  <th className="pb-1 pr-4">Set By</th>
                  <th className="pb-1">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r: { id: string; rate: number; label: string; setByName: string | null; createdAt: string }) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-1 pr-4">{r.rate}</td>
                    <td className="py-1 pr-4">{r.label}</td>
                    <td className="py-1 pr-4">{r.setByName ?? '—'}</td>
                    <td className="py-1">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Shop settings */}
      <Section title="Shop Settings">
        <form onSubmit={submitShop((d) => { setShopError(''); saveShop(d) })}
          className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Show item prices on receipt</label>
            <select {...regShop('receipt_show_item_prices')}
              className={input + ' w-auto'}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bank Account Number</label>
            <input {...regShop('payment_bank_account')} className={input} placeholder="e.g. 1234567890" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mobile Money Number</label>
            <input {...regShop('payment_mobile_money')} className={input} placeholder="e.g. +2547XXXXXXXX" />
          </div>
          <div className="text-xs text-gray-400">Reservation auto-cancel: 6 hours (fixed)</div>
          {shopError && <p className="text-red-500 text-xs">{shopError}</p>}
          <button type="submit" disabled={savingShop}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {savingShop ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
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

const input = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full'
