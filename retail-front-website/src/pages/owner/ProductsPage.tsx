import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService, type ProductOwnerDto, type ProductRequest } from '../../services/products.service'
import { useForm } from 'react-hook-form'

interface Props { currency: 'KES' | 'ETB' }

export default function ProductsPage({ currency }: Props) {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductOwnerDto | null>(null)

  const { data: products, isLoading } = useQuery({
    queryKey: ['products-owner'],
    queryFn: productsService.listOwner,
  })

  const { mutate: deactivate } = useMutation({
    mutationFn: productsService.deactivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products-owner'] }),
  })

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(p: ProductOwnerDto) { setEditing(p); setModalOpen(true) }

  const price = (p: ProductOwnerDto) =>
    currency === 'KES'
      ? `KES ${p.priceKes.toFixed(2)}`
      : `ETB ${p.priceEtb.toFixed(2)}`

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Products</h1>
        <button
          onClick={openAdd}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          + Add Product
        </button>
      </div>

      {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Category</th>
              <th className="pb-2 pr-4">Buying (KES)</th>
              <th className="pb-2 pr-4">Price</th>
              <th className="pb-2 pr-4">Margin %</th>
              <th className="pb-2 pr-4">Stock</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">
                  {p.name}
                  {p.lowStock && (
                    <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                      Low Stock
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 text-gray-500">{p.category ?? '—'}</td>
                <td className="py-2 pr-4">{p.buyingPrice != null ? `${p.buyingPrice.toFixed(2)}` : '—'}</td>
                <td className="py-2 pr-4">{price(p)}</td>
                <td className="py-2 pr-4">{p.profitMarginPercent != null ? `${p.profitMarginPercent}%` : '—'}</td>
                <td className="py-2 pr-4">{p.stockQuantity}</td>
                <td className="py-2 flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-indigo-600 hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { if (confirm('Deactivate this product?')) deactivate(p.id) }}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <ProductModal
          product={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); qc.invalidateQueries({ queryKey: ['products-owner'] }) }}
        />
      )}
    </div>
  )
}

function ProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: ProductOwnerDto | null
  onClose: () => void
  onSaved: () => void
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductRequest>({
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.priceKes,
          buyingPrice: product.buyingPrice ?? undefined,
          stockQuantity: product.stockQuantity,
          minStockAlert: product.minStockAlert,
          imageUrl: product.imageUrl ?? undefined,
        }
      : {},
  })

  const [error, setError] = useState('')

  async function onSubmit(data: ProductRequest) {
    setError('')
    try {
      if (product) {
        await productsService.update(product.id, data)
      } else {
        await productsService.create(data)
      }
      onSaved()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save'
      setError(msg)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">{product ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Field label="Name" error={errors.name?.message}>
            <input {...register('name', { required: 'Required' })} className={input} />
          </Field>
          <Field label="Category">
            <input {...register('category')} className={input} />
          </Field>
          <Field label="Price (KES)" error={errors.price?.message}>
            <input type="number" step="0.01" {...register('price', { required: 'Required', min: { value: 0.01, message: 'Must be > 0' } })} className={input} />
          </Field>
          <Field label="Buying Price (KES)">
            <input type="number" step="0.01" {...register('buyingPrice')} className={input} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock" error={errors.stockQuantity?.message}>
              <input type="number" {...register('stockQuantity', { required: 'Required', min: 0 })} className={input} />
            </Field>
            <Field label="Min Alert" error={errors.minStockAlert?.message}>
              <input type="number" {...register('minStockAlert', { required: 'Required', min: 0 })} className={input} />
            </Field>
          </div>
          <Field label="Image URL">
            <input {...register('imageUrl')} className={input} />
          </Field>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  )
}
