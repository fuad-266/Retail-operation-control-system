import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService, type UserDto, type CreateUserRequest } from '../../services/users.service'
import { useForm } from 'react-hook-form'
import type { Role } from '../../context/AuthContext'

export default function UserManagementPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'staff' | 'customer' | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.list,
  })

  const { mutate: deactivate } = useMutation({
    mutationFn: usersService.deactivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const staff = users?.filter((u) => u.role !== 'CUSTOMER') ?? []
  const customers = users?.filter((u) => u.role === 'CUSTOMER') ?? []

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-bold text-gray-800">User Management</h1>

      {/* Staff */}
      <Section title="Staff Accounts">
        <div className="flex justify-end mb-3">
          <button onClick={() => setModal('staff')}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700">
            + Add Staff
          </button>
        </div>
        <UserTable users={staff} onDeactivate={(id) => { if (confirm('Deactivate user?')) deactivate(id) }} loading={isLoading} />
      </Section>

      {/* Customers */}
      <Section title="Customer Accounts">
        <div className="flex justify-end mb-3">
          <button onClick={() => setModal('customer')}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">
            + Add Customer
          </button>
        </div>
        <UserTable users={customers} onDeactivate={(id) => { if (confirm('Deactivate user?')) deactivate(id) }} loading={isLoading} />
      </Section>

      {modal && (
        <UserModal
          isCustomer={modal === 'customer'}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); qc.invalidateQueries({ queryKey: ['users'] }) }}
        />
      )}
    </div>
  )
}

function UserTable({ users, onDeactivate, loading }: {
  users: UserDto[]
  onDeactivate: (id: string) => void
  loading: boolean
}) {
  if (loading) return <p className="text-sm text-gray-400">Loading...</p>
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b">
          <th className="pb-2 pr-4">Name</th>
          <th className="pb-2 pr-4">Phone</th>
          <th className="pb-2 pr-4">Role</th>
          <th className="pb-2 pr-4">Status</th>
          <th className="pb-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-b border-gray-100">
            <td className="py-2 pr-4 font-medium">{u.fullName}</td>
            <td className="py-2 pr-4 text-gray-500">{u.phoneNumber}</td>
            <td className="py-2 pr-4">
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{u.role}</span>
            </td>
            <td className="py-2 pr-4">
              {u.isActive
                ? <span className="text-xs text-green-600">Active</span>
                : <span className="text-xs text-gray-400">Inactive</span>}
            </td>
            <td className="py-2">
              {u.isActive && (
                <button onClick={() => onDeactivate(u.id)} className="text-red-500 text-xs hover:underline">
                  Deactivate
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function UserModal({ isCustomer, onClose, onSaved }: {
  isCustomer: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateUserRequest>()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function onSubmit(data: CreateUserRequest) {
    setError(''); setSuccess('')
    try {
      let user
      if (isCustomer) {
        user = await usersService.createCustomer(data)
      } else {
        user = await usersService.create(data)
      }
      setSuccess(`Created: ${user.fullName} | Phone: ${user.phoneNumber}`)
      setTimeout(onSaved, 1500)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'
      setError(msg)
    }
  }

  const staffRoles: Role[] = ['CASHIER', 'SELLER', 'GOODS_STAFF', 'OWNER']

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">{isCustomer ? 'Add Customer' : 'Add Staff'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Field label="Full Name" error={errors.fullName?.message}>
            <input {...register('fullName', { required: 'Required' })} className={inp} />
          </Field>
          <Field label="Phone Number" error={errors.phoneNumber?.message}>
            <input {...register('phoneNumber', { required: 'Required' })} className={inp} />
          </Field>
          <Field label="Email (optional)">
            <input {...register('email')} className={inp} type="email" />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <input type="password" {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} className={inp} />
          </Field>
          {!isCustomer && (
            <Field label="Role" error={errors.role?.message}>
              <select {...register('role', { required: 'Required' })} className={inp}>
                <option value="">Select role</option>
                {staffRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          )}
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-600 text-xs">{success}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm disabled:opacity-50">
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
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

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
